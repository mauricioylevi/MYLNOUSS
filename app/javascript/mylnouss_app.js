// MYLNOUSS Application Entry Point

let currentStep = 1;
const totalSteps = 7;
let hasUnsavedChanges = false;

window.initApp = function() {
    console.log("MYLNOUSS Core Initialized.");
    fetchPhotoFingerprints(); // Ensure duplicate registry is populated on load
};

document.addEventListener('turbo:load', window.initApp);
document.addEventListener('DOMContentLoaded', window.initApp);

function initPageSetup() {
    console.log('MYLNOUSS page setup initialized.');
    
    // Add event listeners for selection cards to toggle 'selected' class visually
    const selectionInputs = document.querySelectorAll('.selection-card input');
    selectionInputs.forEach(input => {
        // Prevent double binding if already initialized
        if(input.dataset.initialized) return;
        input.dataset.initialized = "true";
        
        input.addEventListener('change', function() {
            if (this.type === 'radio') {
                const groupName = this.name;
                const siblings = document.querySelectorAll(`input[name="${groupName}"]`);
                siblings.forEach(sibling => {
                    sibling.closest('.selection-card').classList.remove('selected');
                });
            }
            if (this.checked) {
                this.closest('.selection-card').classList.add('selected');
            } else {
                this.closest('.selection-card').classList.remove('selected');
            }
        });
    });
    
    // Track any changes in the questionnaire to warn users before exiting
    const modalBody = document.getElementById('questionnaire-body');
    if (modalBody) {
        modalBody.addEventListener('input', () => { hasUnsavedChanges = true; });
        modalBody.addEventListener('change', () => { hasUnsavedChanges = true; });
    }
    
    // Initialize Questionnaire on Profile Page
    if (document.getElementById('questionnaire-modal')) {
        hasUnsavedChanges = false;
        loadProfileData();
        
        // Re-apply visual selection class based on loaded data
        document.querySelectorAll('.selection-card input:checked').forEach(input => {
            input.closest('.selection-card').classList.add('selected');
        });
        
        updateQuestionnaireView();
    }
}

document.addEventListener('turbo:load', initPageSetup);
document.addEventListener('DOMContentLoaded', initPageSetup);

// Close Profile (Return to Dashboard)
window.closeProfileQuestionnaire = function() {
    if (hasUnsavedChanges) {
        const wantToSave = confirm("You have unsaved changes. Would you like to save them before exiting?");
        if (wantToSave) {
            saveProfileData();
            alert("Profile successfully saved locally in MYLNOUSS!");
        }
    }
    window.location.href = '/';
};

// Handle top bar save button
window.handleGlobalSave = function() {
    saveProfileData();
    hasUnsavedChanges = false;
    alert("Profile successfully saved locally in MYLNOUSS!");
    window.location.href = '/';
};

// Toggle Sidebar Dropdowns
window.toggleSidebarDropdown = function(e, dropdownId, arrowId) {
    if (e) e.preventDefault();
    const dropdown = document.getElementById(dropdownId);
    const arrow = document.getElementById(arrowId);
    
    if (dropdown) {
        dropdown.classList.toggle('open');
    }
    if (arrow) {
        arrow.classList.toggle('open');
    }
};

/* =====================================================================
   PHOTO UPLOAD MODAL LOGIC (MindSpring Layout, MYLNOUSS Theme)
   ===================================================================== */
window.uploadedPhotoRegistry = []; // Tracks fingerprints of uploaded photos
window.currentValidFiles = []; // Temporary holding for filtered files

// Open Photo Modal
window.initPhotoPage = function() {
    // Fetch pending drafts and global fingerprints
    Promise.all([
        fetch('/photos/drafts').then(res => res.json()),
        fetch('/photos/fingerprints').then(res => res.json())
    ]).then(([drafts, fingerprints]) => {
        // Merge backend fingerprints into frontend registry
        fingerprints.forEach(fp => {
            if(!window.uploadedPhotoRegistry.includes(fp)) {
                window.uploadedPhotoRegistry.push(fp);
            }
        });
        
        const itemsWrapper = document.getElementById('photo-items-wrapper');
        if (!itemsWrapper) return; // Not on the photos page
        itemsWrapper.innerHTML = ''; // clear existing
        if(drafts.length > 0) {
            document.getElementById('no-photos-msg').style.display = 'none';
            drafts.forEach(draft => {
                // Drafts don't need fingerprints because we can't easily upload duplicates of them now
                buildPhotoCard(draft.id, draft.url, itemsWrapper);
            });
        } else {
            document.getElementById('no-photos-msg').style.display = 'block';
        }
    });
};

window.buildPhotoCard = function(photoId, imageUrl, itemsWrapper, fingerprint = null) {
    const card = document.createElement('div');
    card.className = 'ms-photo-card';
    card.id = `ms-card-${photoId}`;
    if(fingerprint) card.dataset.fingerprint = fingerprint;
    
    const imgContainer = document.createElement('div');
    imgContainer.style.width = '100%';
    imgContainer.style.height = '100%';
    
    const img = document.createElement('img');
    img.src = imageUrl;
    img.style.cssText = 'width: 100%; height: 100%; min-height: 250px; object-fit: cover; border-radius: 8px; box-shadow: var(--shadow-sm);';
    imgContainer.appendChild(img);
    
    const formContainer = document.createElement('div');
    formContainer.style.display = 'flex';
    formContainer.style.flexDirection = 'column';
    formContainer.style.justifyContent = 'space-between';
    
    const formGroup = document.createElement('div');
    formGroup.className = 'form-group';
    
    const headerFlex = document.createElement('div');
    headerFlex.style.cssText = 'display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 0.75rem;';
    
    const label = document.createElement('label');
    label.style.cssText = 'font-weight: 900; font-size: 0.95rem; color: var(--color-text-main);';
    label.innerHTML = `Step 2: Add Description <span style="color: var(--color-warning); font-size: 0.85rem; font-weight: 700; margin-left: 0.5rem;">(Message mandatory)</span>`;
    
    const charCount = document.createElement('span');
    charCount.style.cssText = 'font-size: 0.85rem; color: var(--color-primary); font-weight: 600;';
    charCount.innerText = '0 / 150';
    
    headerFlex.appendChild(label);
    headerFlex.appendChild(charCount);
    
    const textarea = document.createElement('textarea');
    textarea.className = 'text-input description-input';
    textarea.rows = 5;
    textarea.maxLength = 150;
    textarea.placeholder = "Type a short description of the photograph here...";
    textarea.style.cssText = 'border: 1px solid var(--color-border); border-radius: 8px; width: 100%; padding: 1rem; resize: vertical; box-sizing: border-box; font-family: inherit; font-size: 0.95rem; background: var(--color-bg); color: var(--color-text-main);';
    
    formGroup.appendChild(headerFlex);
    formGroup.appendChild(textarea);
    
    const buttonsArea = document.createElement('div');
    buttonsArea.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-top: 1.5rem; border-top: 1px solid var(--color-border); padding-top: 1.5rem;';
    
    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn btn-primary';
    saveBtn.innerText = 'Save Changes';
    saveBtn.style.cssText = 'padding: 0.6rem 1.5rem; font-size: 1rem; font-weight: 700; border-radius: 8px; opacity: 0.5; cursor: not-allowed; transition: all 0.2s ease;';
    saveBtn.disabled = true;
    
    saveBtn.onclick = function() {
        saveBtn.innerText = 'Saving...';
        saveBtn.disabled = true;

        const formData = new FormData();
        formData.append('description', textarea.value.trim());

        fetch(`/photos/${photoId}`, {
            method: 'PATCH',
            body: formData
        }).then(res => res.json())
        .then(data => {
            if (data.success) {
                saveBtn.innerText = 'Saved!';
                saveBtn.style.opacity = '1';
                card.style.transition = 'all 0.4s ease';
                setTimeout(() => {
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.95)';
                    setTimeout(() => {
                        card.remove();
                        if(document.querySelectorAll('.ms-photo-card').length === 0) {
                            const emptyMsg = document.getElementById('no-photos-msg');
                            emptyMsg.innerHTML = '<p style="font-size: 1.25rem;">All photos saved successfully!</p><p>Use the form on the left to upload another batch.</p>';
                            emptyMsg.style.display = 'block';
                        }
                    }, 400);
                }, 500);
            } else {
                saveBtn.innerText = 'Error saving';
                saveBtn.style.background = 'var(--color-error)';
            }
        }).catch(err => {
            console.error("Upload error:", err);
            saveBtn.innerText = 'Network Error';
            saveBtn.style.background = 'var(--color-error)';
        });
    };
    
    
    buttonsArea.appendChild(saveBtn);
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'ms-delete-btn';
    deleteBtn.innerText = 'Delete Draft';
    deleteBtn.style.cssText = 'padding: 0.6rem 1.5rem; font-size: 1rem; font-weight: 700; border-radius: 8px; cursor: pointer; transition: all 0.2s ease; background: var(--color-error); color: white; border: none;';
    
    deleteBtn.onclick = function() {
        if(confirm('Are you sure you want to delete this draft?')) {
            const currentId = card.id.replace('ms-card-', '');
            
            if(currentId.startsWith('temp-')) {
                // Hasn't uploaded yet, just remove DOM
                const storedFingerprint = card.dataset.fingerprint;
                if(storedFingerprint) {
                    const fIndex = window.uploadedPhotoRegistry.indexOf(storedFingerprint);
                    if(fIndex > -1) window.uploadedPhotoRegistry.splice(fIndex, 1);
                }
                
                card.remove();
                if(document.querySelectorAll('.ms-photo-card').length === 0) {
                    document.getElementById('no-photos-msg').style.display = 'block';
                }
                return;
            }
            
            deleteBtn.innerText = 'Deleting...';
            deleteBtn.disabled = true;
            saveBtn.disabled = true;
            
            fetch(`/photos/${currentId}`, {
                method: 'DELETE'
            }).then(res => res.json())
            .then(data => {
                if (data.success) {
                    // Remove from registry so it can be uploaded again
                    const storedFingerprint = card.dataset.fingerprint;
                    if(storedFingerprint) {
                        const fIndex = window.uploadedPhotoRegistry.indexOf(storedFingerprint);
                        if(fIndex > -1) window.uploadedPhotoRegistry.splice(fIndex, 1);
                    }
                    
                    card.style.transition = 'all 0.4s ease';
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.95)';
                    setTimeout(() => {
                        card.remove();
                        if(document.querySelectorAll('.ms-photo-card').length === 0) {
                            document.getElementById('no-photos-msg').style.display = 'block';
                        }
                    }, 400);
                } else {
                    deleteBtn.innerText = 'Error';
                    deleteBtn.disabled = false;
                }
            }).catch(err => {
                deleteBtn.innerText = 'Error';
                deleteBtn.disabled = false;
            });
        }
    };
    
    buttonsArea.appendChild(deleteBtn);
    
    formContainer.appendChild(formGroup);
    formContainer.appendChild(buttonsArea);
    
    card.appendChild(imgContainer);
    card.appendChild(formContainer);
    itemsWrapper.prepend(card);
    
    textarea.addEventListener('input', function() {
        const text = textarea.value;
        const trimmedLength = text.trim().length;
        charCount.innerText = `${text.length} / 150`;
        if(text.length >= 150) {
            charCount.style.color = 'var(--color-error)';
        } else {
            charCount.style.color = 'var(--color-primary)';
        }
        
        if(trimmedLength > 0) {
            saveBtn.disabled = false;
            saveBtn.style.opacity = '1';
            saveBtn.style.cursor = 'pointer';
        } else {
            saveBtn.disabled = true;
            saveBtn.style.opacity = '0.5';
            saveBtn.style.cursor = 'not-allowed';
        }
    });
};


// Open Photo Gallery Modal
window.initGalleryPage = async function() {
    const wrapper = document.getElementById('gallery-items-wrapper');
    const emptyMsg = document.getElementById('gallery-empty-msg');
    
    if (!wrapper) return;
    
    wrapper.innerHTML = '<p style="text-align:center; width:100%; color:var(--color-text-muted);">Loading your memories...</p>';
    
    try {
        const response = await fetch('/photos.json');
        const photos = await response.json();
        
        wrapper.innerHTML = '';
        
        if (photos.length === 0) {
            emptyMsg.style.display = 'block';
        } else {
            emptyMsg.style.display = 'none';
            
            photos.forEach(photo => {
                const card = document.createElement('div');
                // Break-inside avoid prevents the card from splitting across columns. Natural height.
                card.style.cssText = 'position: relative; background: var(--color-card-bg); border-radius: 12px; overflow: hidden; box-shadow: var(--shadow-sm); border: 1px solid var(--color-border); cursor: pointer; display: block; break-inside: avoid; margin-bottom: 1rem;';
                
                const img = document.createElement('img');
                img.src = photo.url;
                // width: 100% and height: auto ensures the image defines the height of the card organically.
                img.style.cssText = 'width: 100%; height: auto; display: block;';
                
                // Discreet Delete Button
                const deleteBtn = document.createElement('button');
                deleteBtn.innerHTML = '🗑️';
                deleteBtn.style.cssText = 'position: absolute; top: 0.5rem; right: 0.5rem; background: rgba(0, 0, 0, 0.4); border-radius: 50%; color: white; border: none; cursor: pointer; padding: 0.4rem; font-size: 1rem; opacity: 0.6; transition: opacity 0.2s, background 0.2s;';
                deleteBtn.onmouseover = () => { deleteBtn.style.opacity = '1'; deleteBtn.style.background = 'rgba(220, 38, 38, 0.9)'; };
                deleteBtn.onmouseout = () => { deleteBtn.style.opacity = '0.6'; deleteBtn.style.background = 'rgba(0, 0, 0, 0.4)'; };
                
                deleteBtn.addEventListener('click', async (e) => {
                    e.stopPropagation(); // Prevent Lightbox from opening
                    
                    if (confirm('Are you sure you want to delete this photo from the gallery?')) {
                        deleteBtn.innerHTML = '⏳';
                        try {
                            const delResponse = await fetch(`/photos/${photo.id}`, {
                                method: 'DELETE',
                                headers: {
                                    'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.content || ''
                                }
                            });
                            const result = await delResponse.json();
                            if (result.success) {
                                card.remove();
                                if (wrapper.children.length === 0) {
                                    emptyMsg.style.display = 'block';
                                }
                            } else {
                                alert("Failed to delete the photo.");
                                deleteBtn.innerHTML = '🗑️';
                            }
                        } catch (err) {
                            console.error("Deletion error:", err);
                            alert("An error occurred while deleting.");
                            deleteBtn.innerHTML = '🗑️';
                        }
                    }
                });
                
                card.appendChild(img);
                card.appendChild(deleteBtn);

                // Add Lightbox & TTS Interaction
                card.addEventListener('click', () => {
                    openLightbox(photo.id, photo.url, photo.description);
                });
                wrapper.appendChild(card);
            });
        }
    } catch(err) {
        console.error("Error loading photos:", err);
        wrapper.innerHTML = '<p style="text-align:center; width:100%; color:var(--color-error);">Failed to load photos.</p>';
    }
};

// Close Photo Gallery Modal


// Step 1: Detect file selection and enable Upload button
window.handleFileSelectChange = function() {
    const input = document.getElementById('imagesInput');
    const uploadBtn = document.getElementById('uploadBtn');
    const namesLabel = document.getElementById('custom-file-name');
    const warningBlock = document.getElementById('duplicate-warning-msg');
    const warningText = document.getElementById('duplicate-warning-text');
    
    window.currentValidFiles = [];
    let duplicatesSkipped = 0;
    
    if (input.files && input.files.length > 0) {
        let batchFingerprints = new Set();
        
        // Filter out duplicates
        for (let i = 0; i < input.files.length; i++) {
            let file = input.files[i];
            let fingerprint = `${file.name}-${file.size}`; // Match backend format
            
            if (window.uploadedPhotoRegistry.includes(fingerprint) || batchFingerprints.has(fingerprint)) {
                duplicatesSkipped++;
            } else {
                window.currentValidFiles.push(file);
                batchFingerprints.add(fingerprint);
            }
        }
        
        // Handle warning block display
        if (warningBlock && warningText) {
            if (duplicatesSkipped > 0) {
                warningText.innerText = `${duplicatesSkipped} duplicate photo(s) , try new one.`;
                warningBlock.style.display = 'flex';
            } else {
                warningBlock.style.display = 'none';
            }
        }
        
        if (window.currentValidFiles.length > 0) {
            uploadBtn.disabled = false;
            uploadBtn.style.opacity = '1';
            uploadBtn.style.cursor = 'pointer';
            
            if (namesLabel) {
                let fileCount = window.currentValidFiles.length;
                let text = fileCount === 1 ? '1 file' : `${fileCount} files`;
                namesLabel.innerText = text;
                namesLabel.style.color = 'var(--color-text-main)';
            }
        } else {
            // All files were duplicates
            uploadBtn.disabled = true;
            uploadBtn.style.opacity = '0.5';
            uploadBtn.style.cursor = 'not-allowed';
            
            if (namesLabel) {
                namesLabel.innerText = 'No valid files chosen';
                namesLabel.style.color = 'var(--color-error)';
            }
        }
    } else {
        uploadBtn.disabled = true;
        uploadBtn.style.opacity = '0.5';
        uploadBtn.style.cursor = 'not-allowed';
        
        if (namesLabel) {
            namesLabel.innerText = 'No file chosen';
            namesLabel.style.color = 'var(--color-text-muted)';
        }
        
        if (warningBlock) warningBlock.style.display = 'none';
    }
};

let photoIdCounter = 0;

// Step 2: Process files and build UI list
window.processSelectedFiles = function() {
    if(!window.currentValidFiles || window.currentValidFiles.length === 0) return;
    
    document.getElementById('no-photos-msg').style.display = 'none';
    const itemsWrapper = document.getElementById('photo-items-wrapper');
    const input = document.getElementById('imagesInput');
    const uploadBtn = document.getElementById('uploadBtn');
    
    window.currentValidFiles.forEach((file) => {
        let fingerprint = `${file.name}-${file.size}`;
        window.uploadedPhotoRegistry.push(fingerprint);
        
        // Upload immediately as draft
        const formData = new FormData();
        formData.append('image', file);
        
        // Optimistically create card with local URL, but disable save until uploaded
        const localUrl = URL.createObjectURL(file);
        // We need a temporary ID to track it
        const tempId = 'temp-' + Math.random().toString(36).substr(2, 9);
        buildPhotoCard(tempId, localUrl, itemsWrapper, fingerprint);
        
        const card = document.getElementById(`ms-card-${tempId}`);
        const saveBtn = card.querySelector('.btn-primary');
        const originalText = saveBtn.innerText;
        saveBtn.innerText = 'Uploading Draft...';
        
        fetch('/photos', {
            method: 'POST',
            body: formData
        }).then(res => res.json())
        .then(data => {
            if(data.success) {
                // Update the card's ID and button
                card.id = `ms-card-${data.photo.id}`;
                saveBtn.innerText = 'Save Changes';
                // Update the save logic to use the real photo ID
                const textarea = card.querySelector('textarea');
                saveBtn.onclick = function() {
                    saveBtn.innerText = 'Saving...';
                    saveBtn.disabled = true;

                    const patchData = new FormData();
                    patchData.append('description', textarea.value.trim());

                    fetch(`/photos/${data.photo.id}`, {
                        method: 'PATCH',
                        body: patchData
                    }).then(res => res.json())
                    .then(patchRes => {
                        if (patchRes.success) {
                            saveBtn.innerText = 'Saved!';
                            saveBtn.style.opacity = '1';
                            card.style.transition = 'all 0.4s ease';
                            setTimeout(() => {
                                card.style.opacity = '0';
                                card.style.transform = 'scale(0.95)';
                                setTimeout(() => {
                                    card.remove();
                                    if(document.querySelectorAll('.ms-photo-card').length === 0) {
                                        const emptyMsg = document.getElementById('no-photos-msg');
                                        emptyMsg.innerHTML = '<p style="font-size: 1.25rem;">All photos saved successfully!</p><p>Use the form on the left to upload another batch.</p>';
                                        emptyMsg.style.display = 'block';
                                    }
                                }, 400);
                            }, 500);
                        } else {
                            saveBtn.innerText = 'Error saving';
                        }
                    });
                };
            }
        });
    });
    
    // Reset input
    input.value = '';
    window.currentValidFiles = [];
    uploadBtn.disabled = true;
    uploadBtn.style.opacity = '0.5';
    uploadBtn.style.cursor = 'not-allowed';
    
    const namesLabel = document.getElementById('custom-file-name');
    if (namesLabel) {
        namesLabel.innerText = 'No file chosen';
        namesLabel.style.color = 'var(--color-text-muted)';
    }
};




/* =====================================================================
 * QUESTIONNAIRE STEP NAVIGATION LOGIC
 * ===================================================================== */

// Step Navigation Logic
window.handlePrevStep = function() {
    if (currentStep > 1) {
        changeQuestionnaireStep(-1);
    }
};

window.changeQuestionnaireStep = function(direction) {
    // If moving forward, validate the current step first
    if (direction > 0 && !validateCurrentStep()) {
        return;
    }

    // Determine target step
    const newStep = currentStep + direction;
    
    // Boundary checks
    if (newStep < 1) return;
    
    // If submitting on final step via 'Save Profile' bottom button
    if (newStep > totalSteps) {
        saveProfileData();
        hasUnsavedChanges = false;
        alert("Profile successfully saved locally in MYLNOUSS!");
        closeProfileQuestionnaire();
        return;
    }
    
    currentStep = newStep;
    updateQuestionnaireView();
};

// Update DOM based on current step
function updateQuestionnaireView() {
    // Hide all steps
    document.querySelectorAll('.questionnaire-step').forEach(el => {
        el.classList.remove('active');
    });
    
    // Show current step
    document.getElementById(`step-${currentStep}`).classList.add('active');
    
    // Update progress bar & text
    const progressPercent = (currentStep / totalSteps) * 100;
    document.getElementById('progress-bar-fill').style.width = `${progressPercent}%`;
    
    const statusContainer = document.getElementById('completion-status');
    const prevBtn = document.getElementById('prev-step-btn');
    const nextBtn = document.getElementById('next-step-btn');
    
    // Update labels and buttons based on completion
    if (currentStep === totalSteps) {
        statusContainer.innerHTML = '<span style="color: var(--color-primary); font-weight: 700;">✅ Profile Complete</span>';
        nextBtn.style.display = 'none'; // Remove save button from bottom
    } else {
        statusContainer.innerHTML = `Step <span id="current-step-num">${currentStep}</span> of ${totalSteps}`;
        nextBtn.style.display = 'block';
        nextBtn.innerHTML = 'Next Step &rarr;';
    }
    
    // Manage previous button visibility
    if (currentStep === 1) {
        prevBtn.style.visibility = 'hidden';
    } else {
        prevBtn.style.visibility = 'visible';
        prevBtn.innerHTML = '&larr; Back';
    }
}

// Validation Logic
function validateCurrentStep() {
    const currentStepDiv = document.getElementById(`step-${currentStep}`);
    if (!currentStepDiv) return true;

    let isValid = true;
    let errorMessage = "Please fill out all required fields before proceeding.";

    // Text & Select inputs marked required
    const requiredInputs = currentStepDiv.querySelectorAll('.required-field');
    requiredInputs.forEach(input => {
        if (!input.value || !input.value.trim()) {
            isValid = false;
            input.style.borderColor = '#DC2626'; // Red border
            input.style.backgroundColor = '#FEF2F2';
        } else {
            input.style.borderColor = ''; // reset
            input.style.backgroundColor = '';
        }
        
        // Listen for user correction to remove red highlight
        input.addEventListener('input', function() {
            if (this.value && this.value.trim()) {
                this.style.borderColor = '';
                this.style.backgroundColor = '';
            }
        });
    });

    // Radio/Checkbox groups marked required
    const requiredGroups = currentStepDiv.querySelectorAll('.required-group');
    requiredGroups.forEach(group => {
        const inputs = group.querySelectorAll('input');
        let hasChecked = false;
        
        inputs.forEach(input => {
            if (input.checked) {
                hasChecked = true;
            }
        });
        
        if (!hasChecked) {
            isValid = false;
            // Highlight the group slightly
            group.style.border = '1px solid #FCA5A5';
            group.style.backgroundColor = '#FEF2F2';
            group.style.padding = '0.5rem';
            group.style.borderRadius = 'var(--radius-md)';
        } else {
            group.style.border = '';
            group.style.backgroundColor = '';
            group.style.padding = '';
        }
        
        // Listen for selection to remove highlight
        inputs.forEach(input => {
            input.addEventListener('change', function() {
                group.style.border = '';
                group.style.backgroundColor = '';
                group.style.padding = '';
            });
        });
    });

    if (!isValid) {
        alert(errorMessage);
        return false;
    }
    return true;
}

// Save profile to LocalStorage
function saveProfileData() {
    const profileData = {
        inputs: {},
        radios: {},
        checkboxes: {}
    };

    // Save standard text, date, textarea, and select inputs (using IDs)
    const textInputs = document.querySelectorAll('#questionnaire-body input[type="text"], #questionnaire-body input[type="date"], #questionnaire-body textarea, #questionnaire-body select');
    textInputs.forEach(input => {
        if (input.id) {
            profileData.inputs[input.id] = input.value;
        }
    });

    // Save Radio Buttons
    const radioGroups = ['sex', 'marital', 'living', 'exercise'];
    radioGroups.forEach(groupName => {
        const checkedRadio = document.querySelector(`input[name="${groupName}"]:checked`);
        if (checkedRadio) {
            profileData.radios[groupName] = checkedRadio.value;
        }
    });

    // Save Checkboxes
    const checkboxGroups = ['support', 'interest'];
    checkboxGroups.forEach(groupName => {
        const checkedBoxes = document.querySelectorAll(`input[name="${groupName}"]:checked`);
        profileData.checkboxes[groupName] = Array.from(checkedBoxes).map(cb => cb.parentNode.querySelector('span').innerText);
    });

    localStorage.setItem('mylnouss_user_profile', JSON.stringify(profileData));

    // Send the profile data to the backend so the AI features can access it
    fetch('/profile/update', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
        },
        body: JSON.stringify(profileData)
    }).catch(e => console.error("Error saving profile to backend", e));
}

// Load profile from LocalStorage or Backend
function loadProfileData() {
    let profileData = null;
    
    // 1. Try Backend Truth
    const scriptEl = document.getElementById('backend-profile-data');
    if (scriptEl) {
        const backendDataStr = scriptEl.textContent;
        if (backendDataStr && backendDataStr.trim() !== '{}') {
            try {
                profileData = JSON.parse(backendDataStr);
                // Also sync this truth down to localstorage
                localStorage.setItem('mylnouss_user_profile', backendDataStr);
            } catch(e) {
                console.error("Failed to parse backend profile", e);
            }
        }
    }

    // 2. Fallback to LocalStorage
    if (!profileData) {
        const savedData = localStorage.getItem('mylnouss_user_profile');
        if (!savedData) return;
        try {
            profileData = JSON.parse(savedData);
        } catch(e) {
            return;
        }
    }

    try {

        // Load standard inputs
        if (profileData.inputs) {
            Object.keys(profileData.inputs).forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = profileData.inputs[id];
            });
        }

        // Load Radios
        if (profileData.radios) {
            Object.keys(profileData.radios).forEach(groupName => {
                const val = profileData.radios[groupName];
                const radio = document.querySelector(`input[name="${groupName}"][value="${val}"]`);
                if (radio) {
                    radio.checked = true;
                    radio.closest('.selection-card').classList.add('selected');
                }
            });
        }

        // Load Checkboxes
        if (profileData.checkboxes) {
            Object.keys(profileData.checkboxes).forEach(groupName => {
                const values = profileData.checkboxes[groupName];
                const allCheckboxes = document.querySelectorAll(`input[name="${groupName}"]`);
                allCheckboxes.forEach(cb => {
                    const labelSpan = cb.parentNode.querySelector('span');
                    if (labelSpan && values.includes(labelSpan.innerText)) {
                        cb.checked = true;
                        cb.closest('.selection-card').classList.add('selected');
                    }
                });
            });
        }
    } catch (e) {
        console.error("Error loading profile data", e);
    }
}

// Global audio player reference
window.currentAudioPlayer = null;

// Lightbox & Text-to-Speech API
window.openLightbox = async function(photoId, imageUrl, description) {
    const modal = document.getElementById('photo-lightbox-modal');
    const imgEl = document.getElementById('lightbox-image');
    const descEl = document.getElementById('lightbox-description');
    
    // Set content
    imgEl.src = imageUrl;
    const textToRead = description || "No description provided.";
    descEl.innerText = textToRead;
    
    // Show modal
    modal.classList.add('active');
    
    // Stop any currently playing audio
    if (window.currentAudioPlayer) {
        window.currentAudioPlayer.pause();
        window.currentAudioPlayer = null;
    }
    
    // Show loading state for audio
    const readingBadge = modal.querySelector('div[style*="background: var(--color-primary)"]');
    if (readingBadge) {
        readingBadge.innerHTML = '<span style="font-size: 1.2rem;">⏳</span> Generating Audio...';
        readingBadge.style.opacity = '1';
    }
    
    try {
        const response = await fetch(`/photos/${photoId}/generate_audio`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await response.json();
        
        if (data.success && data.url) {
            if (readingBadge) {
                readingBadge.innerHTML = '<span style="font-size: 1.2rem;">🔊</span> Playing Audio...';
            }
            window.currentAudioPlayer = new Audio(data.url);
            
            window.currentAudioPlayer.onended = () => {
                if (readingBadge) readingBadge.style.opacity = '0';
            };
            
            await window.currentAudioPlayer.play();
        } else {
            console.error("ElevenLabs Error:", data.error);
            if (readingBadge) {
                readingBadge.innerHTML = '<span style="font-size: 1.2rem;">❌</span> Audio Error';
                setTimeout(() => readingBadge.style.opacity = '0', 2000);
            }
        }
    } catch (error) {
        console.error("Fetch Error:", error);
    }
};

window.closeLightbox = function() {
    const modal = document.getElementById('photo-lightbox-modal');
    modal.classList.remove('active');
    
    // Immediately stop reading when closed
    if (window.currentAudioPlayer) {
        window.currentAudioPlayer.pause();
        window.currentAudioPlayer = null;
    }
};

// ==========================================
// Profile Picture Quiz Game Logic
// ==========================================
window.currentQuizQueue = [];
window.totalQuizRounds = 0;

window.openProfileQuizModal = function(e) {
    if (e) e.preventDefault();
    const modal = document.getElementById('profile-quiz-modal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    startProfileQuiz();
};

window.closeProfileQuizModal = function(e) {
    if (e) e.preventDefault();
    const modal = document.getElementById('profile-quiz-modal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
};

window.startProfileQuiz = async function() {
    const loadingState = document.getElementById('quiz-loading-state');
    const gameState = document.getElementById('quiz-game-state');
    const endState = document.getElementById('quiz-end-state');
    
    loadingState.style.display = 'flex';
    gameState.style.display = 'none';
    endState.style.display = 'none';
    
    try {
        const response = await fetch('/games/profile_quiz');
        const data = await response.json();
        
        if (data.success && data.rounds.length > 0) {
            window.currentQuizQueue = data.rounds;
            window.totalQuizRounds = data.rounds.length;
            renderNextQuizRound();
        } else {
            alert("Failed to generate game: " + (data.error || "Unknown error. Check API key."));
            closeProfileQuizModal();
        }
    } catch (err) {
        console.error("Quiz Error:", err);
        alert("Network error while generating game.");
        closeProfileQuizModal();
    }
};

window.renderNextQuizRound = function() {
    const loadingState = document.getElementById('quiz-loading-state');
    const gameState = document.getElementById('quiz-game-state');
    const endState = document.getElementById('quiz-end-state');
    
    if (window.currentQuizQueue.length === 0) {
        gameState.style.display = 'none';
        endState.style.display = 'block';
        return;
    }
    
    loadingState.style.display = 'none';
    gameState.style.display = 'flex';
    
    const round = window.currentQuizQueue.shift(); // Get next round
    
    // Update Progress
    const completed = window.totalQuizRounds - window.currentQuizQueue.length;
    document.getElementById('quiz-progress').innerText = `Round ${completed} of ${window.totalQuizRounds}`;
    
    // Set Image (base64)
    document.getElementById('quiz-image').src = `data:image/jpeg;base64,${round.image_base64}`;
    
    // Render Choices
    const choicesDiv = document.getElementById('quiz-choices');
    choicesDiv.innerHTML = '';
    
    // Shuffle choices randomly
    const shuffledChoices = [...round.choices].sort(() => Math.random() - 0.5);
    
    shuffledChoices.forEach(choice => {
        const btn = document.createElement('button');
        btn.className = 'quiz-btn';
        btn.innerText = choice;
        
        btn.onclick = function() {
            // Disable all buttons to prevent double clicking
            Array.from(choicesDiv.children).forEach(b => b.disabled = true);
            
            if (choice === round.answer) {
                btn.classList.add('correct');
                // Proceed to next round
                setTimeout(renderNextQuizRound, 1500);
            } else {
                btn.classList.add('wrong');
                // Highlight the correct one as well
                Array.from(choicesDiv.children).forEach(b => {
                    if (b.innerText === round.answer) b.classList.add('correct');
                });
                
                // Retry Logic: Push it to the back of the queue
                window.currentQuizQueue.push(round);
                window.totalQuizRounds++; // Increase total to accurately track progress
                
                setTimeout(renderNextQuizRound, 2000);
            }
        };
        
        choicesDiv.appendChild(btn);
    });
};

// ==========================================
// Photo Memory Game Logic
// ==========================================
window.pmRounds = [];
window.pmCurrentRoundIndex = 0;
window.pmScore = 0;
window.pmTimer = null;

window.openPhotoMemoryModal = function(e) {
    if (e) e.preventDefault();
    const modal = document.getElementById('photo-memory-modal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    startPhotoMemory();
};

window.closePhotoMemoryModal = function(e) {
    if (e) e.preventDefault();
    const modal = document.getElementById('photo-memory-modal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
    clearInterval(window.pmTimer);
};

window.startPhotoMemory = async function() {
    window.pmScore = 0;
    window.pmCurrentRoundIndex = 0;
    
    document.getElementById('pm-loading-state').style.display = 'flex';
    document.getElementById('pm-memory-state').style.display = 'none';
    document.getElementById('pm-quiz-state').style.display = 'none';
    document.getElementById('pm-end-state').style.display = 'none';
    
    try {
        const response = await fetch('/games/photo_memory');
        const data = await response.json();
        
        if (data.success && data.rounds.length > 0) {
            window.pmRounds = data.rounds;
            pmStartMemoryPhase();
        } else {
            alert(data.error || "Failed to generate game.");
            closePhotoMemoryModal();
        }
    } catch (err) {
        console.error("Photo Memory Error:", err);
        alert("Network error while generating game.");
        closePhotoMemoryModal();
    }
};

window.pmStartMemoryPhase = function() {
    if (window.pmCurrentRoundIndex >= window.pmRounds.length) {
        // End Game
        document.getElementById('pm-memory-state').style.display = 'none';
        document.getElementById('pm-quiz-state').style.display = 'none';
        document.getElementById('pm-end-state').style.display = 'block';
        document.getElementById('pm-final-score').innerText = `You got ${window.pmScore} out of ${window.pmRounds.length} correct!`;
        return;
    }
    
    const round = window.pmRounds[window.pmCurrentRoundIndex];
    
    document.getElementById('pm-loading-state').style.display = 'none';
    document.getElementById('pm-quiz-state').style.display = 'none';
    document.getElementById('pm-memory-state').style.display = 'flex';
    
    document.getElementById('pm-progress').innerText = `Round ${window.pmCurrentRoundIndex + 1} of ${window.pmRounds.length}`;
    document.getElementById('pm-image').src = round.image_url;
    
    // Start Timer
    let timeLeft = 60;
    document.getElementById('pm-timer').innerText = timeLeft;
    clearInterval(window.pmTimer);
    
    window.pmTimer = setInterval(() => {
        timeLeft--;
        document.getElementById('pm-timer').innerText = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(window.pmTimer);
            pmStartQuizPhase();
        }
    }, 1000);
};

window.pmStartQuizPhase = function() {
    clearInterval(window.pmTimer);
    
    document.getElementById('pm-memory-state').style.display = 'none';
    document.getElementById('pm-quiz-state').style.display = 'flex';
    
    const round = window.pmRounds[window.pmCurrentRoundIndex];
    document.getElementById('pm-quiz-progress').innerText = `Round ${window.pmCurrentRoundIndex + 1} of ${window.pmRounds.length}`;
    document.getElementById('pm-question').innerText = round.question;
    
    const choicesDiv = document.getElementById('pm-choices');
    choicesDiv.innerHTML = '';
    
    const shuffledChoices = [...round.choices].sort(() => Math.random() - 0.5);
    
    shuffledChoices.forEach(choice => {
        const btn = document.createElement('button');
        btn.className = 'quiz-btn';
        btn.innerText = choice;
        
        btn.onclick = function() {
            Array.from(choicesDiv.children).forEach(b => b.disabled = true);
            
            if (choice === round.answer) {
                btn.classList.add('correct');
                window.pmScore++;
            } else {
                btn.classList.add('wrong');
                Array.from(choicesDiv.children).forEach(b => {
                    if (b.innerText === round.answer) b.classList.add('correct');
                });
            }
            
            window.pmCurrentRoundIndex++;
            setTimeout(pmStartMemoryPhase, 1500);
        };
        
        choicesDiv.appendChild(btn);
    });
};
/* ==========================================================================
   CARDS MATCH GAME
   ========================================================================== */

window.cmState = {
    deck: [],
    flippedCards: [],
    matchedPairs: 0,
    totalPairs: 0,
    isLocked: false,
    currentDifficulty: 'easy'
};

window.openCardsMatchModal = function(e) {
    if(e) e.preventDefault();
    document.getElementById('cards-match-modal').classList.add('active');
    document.body.style.overflow = 'hidden';
    startCardsMatch('easy');
};

window.closeCardsMatchModal = function() {
    document.getElementById('cards-match-modal').classList.remove('active');
    document.body.style.overflow = '';
};

window.startCardsMatch = async function(difficulty) {
    window.cmState.currentDifficulty = difficulty;

    document.getElementById('cards-match-game-screen').style.display = 'none';
    document.getElementById('cards-match-loading-screen').style.display = 'flex';
    
    let pairsNeeded = 4;
    let gridCols = 4;
    let modalWidth = '650px'; // Cap the width so cards don't get too tall
    
    if (difficulty === 'medium') { pairsNeeded = 6; gridCols = 4; modalWidth = '650px'; }
    if (difficulty === 'hard') { pairsNeeded = 8; gridCols = 4; modalWidth = '650px'; }
    
    const modalContent = document.getElementById('cards-match-modal-content');
    if (modalContent) {
        modalContent.style.maxWidth = modalWidth;
    }

    ['easy', 'medium', 'hard'].forEach(level => {
        const btn = document.getElementById(`cm-btn-${level}`);
        if(btn) {
            btn.className = (level === difficulty) ? 'btn' : 'btn btn-outline';
        }
    });
    
    window.cmState.totalPairs = pairsNeeded;
    window.cmState.matchedPairs = 0;
    window.cmState.flippedCards = [];
    window.cmState.isLocked = false;
    
    try {
        const response = await fetch(`/games/cards_match?difficulty=${difficulty}`);
        const result = await response.json();
        
        if(result.success) {
            window.cmState.deck = result.deck;
            cmRenderBoard(gridCols);
            
            document.getElementById('cards-match-loading-screen').style.display = 'none';
            document.getElementById('cards-match-game-screen').style.display = 'flex';
            cmUpdateStats();
        } else {
            alert("Error loading game.");
            closeCardsMatchModal();
        }
    } catch (error) {
        console.error("Cards Match Error:", error);
        alert("Failed to connect.");
        closeCardsMatchModal();
    }
};

window.cmRenderBoard = function(gridCols) {
    const board = document.getElementById('cards-match-board');
    board.style.gridTemplateColumns = `repeat(${gridCols}, 1fr)`;
    board.innerHTML = '';
    
    window.cmState.deck.forEach((imgUrl, index) => {
        const card = document.createElement('div');
        // A perspective container for 3D flip
        card.style.cssText = `
            position: relative; 
            aspect-ratio: 1 / 1; 
            cursor: pointer; 
            perspective: 1000px;
        `;
        
        const cardInner = document.createElement('div');
        cardInner.style.cssText = `
            position: relative; 
            width: 100%; 
            height: 100%; 
            text-align: center; 
            transition: transform 0.6s; 
            transform-style: preserve-3d;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            border-radius: 12px;
        `;
        cardInner.id = `cm-card-${index}`;
        
        const cardFront = document.createElement('div');
        cardFront.style.cssText = `
            position: absolute; 
            width: 100%; 
            height: 100%; 
            backface-visibility: hidden; 
            background: linear-gradient(135deg, var(--color-primary), #1a237e); 
            border-radius: 12px; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            font-size: 3rem; 
            color: white; 
            border: 2px solid rgba(255,255,255,0.2);
        `;
        cardFront.innerHTML = '🎴';
        
        const cardBack = document.createElement('div');
        cardBack.style.cssText = `
            position: absolute; 
            width: 100%; 
            height: 100%; 
            backface-visibility: hidden; 
            transform: rotateY(180deg); 
            background: white; 
            border-radius: 12px; 
            overflow: hidden;
            border: 2px solid var(--color-border);
        `;
        
        const img = document.createElement('img');
        img.src = imgUrl;
        img.style.cssText = 'width: 100%; height: 100%; object-fit: cover;';
        
        cardBack.appendChild(img);
        cardInner.appendChild(cardFront);
        cardInner.appendChild(cardBack);
        card.appendChild(cardInner);
        
        card.addEventListener('click', () => cmFlipCard(index, imgUrl));
        
        board.appendChild(card);
    });
};

window.cmFlipCard = function(index, imgUrl) {
    if (window.cmState.isLocked) return;
    
    const cardInner = document.getElementById(`cm-card-${index}`);
    
    // Prevent double clicking the same card, or clicking already matched cards
    if (cardInner.style.transform === 'rotateY(180deg)' || cardInner.dataset.matched === 'true') {
        return;
    }
    
    cardInner.style.transform = 'rotateY(180deg)';
    window.cmState.flippedCards.push({ index, imgUrl, element: cardInner });
    
    if (window.cmState.flippedCards.length === 2) {
        window.cmState.isLocked = true;
        cmCheckMatch();
    }
};

window.cmCheckMatch = function() {
    const card1 = window.cmState.flippedCards[0];
    const card2 = window.cmState.flippedCards[1];
    
    if (card1.imgUrl === card2.imgUrl) {
        // Match!
        window.cmState.matchedPairs++;
        cmUpdateStats();
        
        // Gray them out slightly
        setTimeout(() => {
            card1.element.style.opacity = '0.3';
            card1.element.dataset.matched = 'true';
            card2.element.style.opacity = '0.3';
            card2.element.dataset.matched = 'true';
            window.cmState.flippedCards = [];
            window.cmState.isLocked = false;
            
            if (window.cmState.matchedPairs === window.cmState.totalPairs) {
                cmEndGame();
            }
        }, 500);
    } else {
        // No match, flip back
        setTimeout(() => {
            card1.element.style.transform = '';
            card2.element.style.transform = '';
            window.cmState.flippedCards = [];
            window.cmState.isLocked = false;
        }, 1000);
    }
};

window.cmUpdateStats = function() {
    document.getElementById('cards-match-stats').innerText = `Matches: ${window.cmState.matchedPairs} / ${window.cmState.totalPairs}`;
};

window.cmEndGame = function() {
    setTimeout(() => {
        document.getElementById('cards-match-game-screen').style.display = 'none';
        document.getElementById('cards-match-end-screen').style.display = 'flex';
    }, 1000);
};


/* ==========================================================================
   CROSSWORD GAME
   ========================================================================== */

window.cwState = {
    words: [],
    grid: [],
    width: 0,
    height: 0,
    currentDifficulty: 'easy',
    inputs: {}
};

window.startCrossword = async function(difficulty) {
    window.cwState.currentDifficulty = difficulty;
    
    document.getElementById('crossword-game-screen').style.display = 'none';
    document.getElementById('crossword-end-screen').style.display = 'none';
    document.getElementById('crossword-loading-screen').style.display = 'flex';
    
    ['easy', 'medium', 'hard'].forEach(level => {
        const btn = document.getElementById(`cw-btn-${level}`);
        if(btn) btn.className = (level === difficulty) ? 'btn' : 'btn btn-outline';
    });
    
    try {
        const response = await fetch(`/games/crossword.json?difficulty=${difficulty}`);
        const result = await response.json();
        
        if (result.success && result.words && result.words.length > 0) {
            generateCrosswordLayout(result.words);
            renderCrossword();
            document.getElementById('crossword-loading-screen').style.display = 'none';
            document.getElementById('crossword-game-screen').style.display = 'flex';
        } else {
            alert("Failed to generate puzzle.");
            window.location.href = '/';
        }
    } catch(e) {
        console.error("Crossword Error: ", e);
        alert("Failed to connect.");
        window.location.href = '/';
    }
};

window.generateCrosswordLayout = function(rawWords) {
    let sorted = rawWords.sort((a,b) => b.word.length - a.word.length);
    let grid = Array(50).fill(null).map(() => Array(50).fill(null));
    let placedWords = [];
    
    function canPlace(wordStr, startX, startY, isHoriz) {
        if (startX < 0 || startY < 0 || startX + (isHoriz ? wordStr.length : 0) >= 50 || startY + (!isHoriz ? wordStr.length : 0) >= 50) return false;
        
        let intersections = 0;
        for (let i = 0; i < wordStr.length; i++) {
            let cx = isHoriz ? startX + i : startX;
            let cy = isHoriz ? startY : startY + i;
            let char = wordStr[i];
            
            if (grid[cy][cx] !== null && grid[cy][cx] !== char) return false;
            if (grid[cy][cx] === char) intersections++;
            
            if (grid[cy][cx] === null) {
                if (isHoriz) {
                    if (grid[cy-1] && grid[cy-1][cx] !== null) return false;
                    if (grid[cy+1] && grid[cy+1][cx] !== null) return false;
                } else {
                    if (grid[cy][cx-1] !== null) return false;
                    if (grid[cy][cx+1] !== null) return false;
                }
            }
        }
        
        if (isHoriz) {
            if (grid[startY][startX-1] !== null || grid[startY][startX+wordStr.length] !== null) return false;
        } else {
            if (grid[startY-1] && grid[startY-1][startX] !== null) return false;
            if (grid[startY+wordStr.length] && grid[startY+wordStr.length][startX] !== null) return false;
        }
        
        return true;
    }
    
    function place(wordObj, startX, startY, isHoriz) {
        wordObj.x = startX;
        wordObj.y = startY;
        wordObj.isHorizontal = isHoriz;
        wordObj.number = placedWords.length + 1;
        
        for(let i=0; i<wordObj.word.length; i++) {
            let cx = isHoriz ? startX + i : startX;
            let cy = isHoriz ? startY : startY + i;
            grid[cy][cx] = wordObj.word[i];
        }
        placedWords.push(wordObj);
    }
    
    if (sorted.length > 0) {
        place(sorted[0], 25, 25, true);
    }
    
    for (let i = 1; i < sorted.length; i++) {
        let wordObj = sorted[i];
        let wordStr = wordObj.word;
        let placed = false;
        
        for (let p of placedWords) {
            if (placed) break;
            
            for (let j = 0; j < wordStr.length; j++) {
                if (placed) break;
                for (let k = 0; k < p.word.length; k++) {
                    if (wordStr[j] === p.word[k]) {
                        let startX = p.isHorizontal ? p.x + k : p.x - j;
                        let startY = p.isHorizontal ? p.y - j : p.y + k;
                        let isHoriz = !p.isHorizontal;
                        
                        if (canPlace(wordStr, startX, startY, isHoriz)) {
                            place(wordObj, startX, startY, isHoriz);
                            placed = true;
                            break;
                        }
                    }
                }
            }
        }
    }
    
    let minX = 50, maxX = 0, minY = 50, maxY = 0;
    for(let w of placedWords) {
        minX = Math.min(minX, w.x);
        minY = Math.min(minY, w.y);
        maxX = Math.max(maxX, w.isHorizontal ? w.x + w.word.length - 1 : w.x);
        maxY = Math.max(maxY, !w.isHorizontal ? w.y + w.word.length - 1 : w.y);
    }
    
    placedWords.forEach(w => {
        w.x -= minX;
        w.y -= minY;
    });
    
    window.cwState.words = placedWords;
    window.cwState.width = maxX - minX + 1;
    window.cwState.height = maxY - minY + 1;
    
    let finalGrid = Array(window.cwState.height).fill(null).map(() => Array(window.cwState.width).fill(null));
    placedWords.forEach(w => {
        for(let i=0; i<w.word.length; i++) {
            let cx = w.isHorizontal ? w.x + i : w.x;
            let cy = w.isHorizontal ? w.y : w.y + i;
            if (!finalGrid[cy][cx]) {
                finalGrid[cy][cx] = { letter: w.word[i], words: [], number: (i === 0) ? w.number : null };
            } else if (i === 0) {
                finalGrid[cy][cx].number = w.number;
            }
            finalGrid[cy][cx].words.push(w);
        }
    });
    
    window.cwState.grid = finalGrid;
};

window.renderCrossword = function() {
    const board = document.getElementById('crossword-board');
    const cluesContainer = document.getElementById('crossword-clues-container');
    
    board.innerHTML = '';
    cluesContainer.innerHTML = '';
    
    board.style.display = 'grid';
    board.style.gridTemplateColumns = `repeat(${window.cwState.width}, 45px)`;
    board.style.gridTemplateRows = `repeat(${window.cwState.height}, 45px)`;
    board.style.background = 'transparent';
    board.style.border = 'none';
    board.style.gap = '6px';
    board.style.padding = '10px';
    
    window.cwState.inputs = {};
    window.cwState.currentDirection = 'horizontal';
    window.cwState.focusedInput = null;
    
    const moveCrosswordFocus = (x, y, dx, dy) => {
        let nx = parseInt(x) + dx;
        let ny = parseInt(y) + dy;
        let nextInput = window.cwState.inputs[`${nx},${ny}`];
        if (nextInput) {
            nextInput.focus();
            return true;
        }
        return false;
    };
    
    for (let y = 0; y < window.cwState.height; y++) {
        for (let x = 0; x < window.cwState.width; x++) {
            let cellData = window.cwState.grid[y][x];
            let cellDiv = document.createElement('div');
            cellDiv.style.width = '45px';
            cellDiv.style.height = '45px';
            cellDiv.style.position = 'relative';
            
            if (cellData) {
                cellDiv.style.background = 'var(--color-surface)';
                cellDiv.style.borderRadius = '8px';
                cellDiv.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                cellDiv.style.transition = 'transform 0.2s';
                cellDiv.style.border = '1px solid var(--color-border)';
                
                if (cellData.number) {
                    let num = document.createElement('span');
                    num.innerText = cellData.number;
                    num.style.position = 'absolute';
                    num.style.top = '4px';
                    num.style.left = '4px';
                    num.style.fontSize = '11px';
                    num.style.fontWeight = 'bold';
                    num.style.color = 'var(--color-text-muted)';
                    num.style.zIndex = '1';
                    cellDiv.appendChild(num);
                }
                
                let input = document.createElement('input');
                input.type = 'text';
                input.maxLength = 1;
                input.dataset.x = x;
                input.dataset.y = y;
                input.dataset.letter = cellData.letter;
                input.style.width = '100%';
                input.style.height = '100%';
                input.style.border = 'none';
                input.style.background = 'transparent';
                input.style.textAlign = 'center';
                input.style.fontSize = '24px';
                input.style.fontWeight = 'bold';
                input.style.textTransform = 'uppercase';
                input.style.outline = 'none';
                input.style.color = 'var(--color-text-main)';
                input.style.paddingTop = '8px'; // Push text down slightly so it doesn't overlap the number
                
                input.addEventListener('mousedown', (e) => {
                    if (window.cwState.focusedInput === input) {
                        window.cwState.currentDirection = window.cwState.currentDirection === 'horizontal' ? 'vertical' : 'horizontal';
                    }
                });
                
                input.addEventListener('focus', () => {
                    cellDiv.style.transform = 'scale(1.05)';
                    cellDiv.style.boxShadow = '0 6px 12px rgba(0,0,0,0.15)';
                    input.style.color = 'var(--color-primary)';
                    window.cwState.focusedInput = input;
                });
                
                input.addEventListener('blur', () => {
                    cellDiv.style.transform = 'scale(1)';
                    cellDiv.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                    input.style.color = 'var(--color-text-main)';
                    if (window.cwState.focusedInput === input) {
                        window.cwState.focusedInput = null;
                    }
                });
                
                input.addEventListener('keydown', (e) => {
                    let cx = parseInt(input.dataset.x);
                    let cy = parseInt(input.dataset.y);
                    
                    if (e.key === 'ArrowRight') { moveCrosswordFocus(cx, cy, 1, 0); e.preventDefault(); }
                    else if (e.key === 'ArrowLeft') { moveCrosswordFocus(cx, cy, -1, 0); e.preventDefault(); }
                    else if (e.key === 'ArrowDown') { moveCrosswordFocus(cx, cy, 0, 1); e.preventDefault(); }
                    else if (e.key === 'ArrowUp') { moveCrosswordFocus(cx, cy, 0, -1); e.preventDefault(); }
                    else if (e.key === 'Backspace' && input.value === '') {
                        let dx = window.cwState.currentDirection === 'horizontal' ? -1 : 0;
                        let dy = window.cwState.currentDirection === 'vertical' ? -1 : 0;
                        moveCrosswordFocus(cx, cy, dx, dy);
                    }
                });
                
                input.addEventListener('input', (e) => {
                    e.target.value = e.target.value.toUpperCase();
                    if (e.target.value !== '') {
                        let cx = parseInt(input.dataset.x);
                        let cy = parseInt(input.dataset.y);
                        let dx = window.cwState.currentDirection === 'horizontal' ? 1 : 0;
                        let dy = window.cwState.currentDirection === 'vertical' ? 1 : 0;
                        moveCrosswordFocus(cx, cy, dx, dy);
                    }
                    checkCrosswordVictory();
                });
                
                window.cwState.inputs[`${x},${y}`] = input;
                cellDiv.appendChild(input);
            } else {
                cellDiv.style.background = 'transparent';
            }
            
            board.appendChild(cellDiv);
        }
    }
    
    let acrossClues = window.cwState.words.filter(w => w.isHorizontal);
    let downClues = window.cwState.words.filter(w => !w.isHorizontal);
    
    let cluesHtml = `<div style="margin-bottom: 1.5rem;"><h5 style="color: var(--color-primary); border-bottom: 1px solid var(--color-border); padding-bottom: 0.5rem; margin-bottom: 0.5rem;">Across</h5>`;
    acrossClues.forEach(w => {
        cluesHtml += `<div style="margin-bottom: 0.5rem; font-size: 0.95rem; color: var(--color-text-main);"><strong>${w.number}.</strong> ${w.clue}</div>`;
    });
    cluesHtml += `</div><div><h5 style="color: var(--color-primary); border-bottom: 1px solid var(--color-border); padding-bottom: 0.5rem; margin-bottom: 0.5rem;">Down</h5>`;
    downClues.forEach(w => {
        cluesHtml += `<div style="margin-bottom: 0.5rem; font-size: 0.95rem; color: var(--color-text-main);"><strong>${w.number}.</strong> ${w.clue}</div>`;
    });
    cluesHtml += `</div>`;
    
    cluesContainer.innerHTML = cluesHtml;
};

window.checkCrosswordVictory = function() {
    let allFilled = true;
    let allCorrect = true;
    for (let key in window.cwState.inputs) {
        let input = window.cwState.inputs[key];
        if (input.value === '') {
            allFilled = false;
        }
        if (input.value !== input.dataset.letter) {
            allCorrect = false;
        }
    }
    
    if (allCorrect && allFilled && Object.keys(window.cwState.inputs).length > 0) {
        document.getElementById('crossword-game-screen').style.display = 'none';
        document.getElementById('crossword-end-screen').style.display = 'flex';
    }
};

window.giveCrosswordHint = function() {
    let emptyOrIncorrectInputs = [];
    
    for (let key in window.cwState.inputs) {
        let input = window.cwState.inputs[key];
        if (input.value !== input.dataset.letter) {
            emptyOrIncorrectInputs.push(input);
        }
    }
    
    if (emptyOrIncorrectInputs.length > 0) {
        // Pick a random square
        let randomIndex = Math.floor(Math.random() * emptyOrIncorrectInputs.length);
        let targetInput = emptyOrIncorrectInputs[randomIndex];
        
        // Fill it with the correct letter and flash it green briefly
        targetInput.value = targetInput.dataset.letter;
        targetInput.style.backgroundColor = 'var(--color-primary-light)';
        targetInput.style.transition = 'background-color 0.5s';
        
        setTimeout(() => {
            targetInput.style.backgroundColor = 'transparent';
        }, 1000);
        
        checkCrosswordVictory();
    }
};

/* =========================================
   MISSING WORD GAME
========================================= */

window.initMissingWordPage = async function() {
    const loadingScreen = document.getElementById('missing-word-loading-screen');
    const gameScreen = document.getElementById('missing-word-game-screen');
    const endScreen = document.getElementById('missing-word-end-screen');
    const hintBtn = document.getElementById('missing-word-hint-btn');
    
    if (!loadingScreen) return;
    
    loadingScreen.style.display = 'flex';
    gameScreen.style.display = 'none';
    endScreen.style.display = 'none';
    if (hintBtn) hintBtn.style.display = 'none';
    
    try {
        const response = await fetch('/games/missing_word.json');
        const result = await response.json();
        
        if (result.success && result.game_data) {
            setupMissingWordGame(result.game_data);
            loadingScreen.style.display = 'none';
            gameScreen.style.display = 'flex';
        } else {
            console.error("Missing Word Error", result.error);
            loadingScreen.innerHTML = '<h3 style="color:var(--color-error)">Failed to load game data. Please try again later.</h3>';
        }
    } catch (e) {
        console.error(e);
        loadingScreen.innerHTML = '<h3 style="color:var(--color-error)">Network error.</h3>';
    }
};

window.setupMissingWordGame = function(data) {
    const sentenceEl = document.getElementById('missing-word-sentence');
    const inputsEl = document.getElementById('missing-word-inputs');
    const hintBtn = document.getElementById('missing-word-hint-btn');
    if (hintBtn) hintBtn.style.display = 'block';
    
    const parts = data.sentence.split('[MISSING_WORD]');
    const word = data.missing_word.toUpperCase();
    
    // Render sentence with underscores to visualize the missing word length in the text itself
    const underscores = Array(word.length).fill('_').join(' ');
    // If the split didn't find the tag, just render it all (fallback)
    if (parts.length < 2) {
        sentenceEl.innerHTML = data.sentence;
    } else {
        sentenceEl.innerHTML = `${parts[0]} <span style="color: var(--color-primary); font-weight: 800; letter-spacing: 2px;">${underscores}</span> ${parts[1]}`;
    }
    
    inputsEl.innerHTML = '';
    window.missingWordAnswer = word;
    
    for (let i = 0; i < word.length; i++) {
        const input = document.createElement('input');
        input.type = 'text';
        input.maxLength = 1;
        input.style.cssText = 'width: 3.5rem; height: 4.5rem; font-size: 2.2rem; text-align: center; text-transform: uppercase; border: 2px solid var(--color-border); border-radius: 12px; font-weight: 800; color: var(--color-text-main); background: var(--color-surface); outline: none; transition: all 0.2s; box-shadow: var(--shadow-sm);';
        input.dataset.index = i;
        
        input.addEventListener('focus', (e) => {
            e.target.style.borderColor = 'var(--color-primary)';
            e.target.style.boxShadow = '0 0 0 4px rgba(99, 102, 241, 0.2)';
        });
        
        input.addEventListener('blur', (e) => {
            e.target.style.borderColor = 'var(--color-border)';
            e.target.style.boxShadow = 'var(--shadow-sm)';
        });
        
        input.addEventListener('input', (e) => {
            if (e.target.value.length === 1) {
                e.target.value = e.target.value.toUpperCase();
                // Move to next input
                const next = inputsEl.querySelector(`input[data-index="${i + 1}"]`);
                if (next) next.focus();
                checkMissingWordCompletion();
            }
        });
        
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && e.target.value === '') {
                const prev = inputsEl.querySelector(`input[data-index="${i - 1}"]`);
                if (prev) {
                    prev.focus();
                }
            } else if (e.key === 'ArrowLeft') {
                const prev = inputsEl.querySelector(`input[data-index="${i - 1}"]`);
                if (prev) prev.focus();
            } else if (e.key === 'ArrowRight') {
                const next = inputsEl.querySelector(`input[data-index="${i + 1}"]`);
                if (next) next.focus();
            }
        });
        
        inputsEl.appendChild(input);
    }
    
    // Focus first input
    setTimeout(() => {
        const first = inputsEl.querySelector('input');
        if (first) first.focus();
    }, 100);
};

window.checkMissingWordCompletion = function() {
    const inputsEl = document.getElementById('missing-word-inputs');
    const inputs = inputsEl.querySelectorAll('input');
    let guess = '';
    inputs.forEach(i => guess += i.value);
    
    if (guess.length === window.missingWordAnswer.length) {
        if (guess === window.missingWordAnswer) {
            inputs.forEach(i => {
                i.style.borderColor = '#10b981';
                i.style.backgroundColor = '#ecfdf5';
                i.style.color = '#047857';
            });
            setTimeout(() => {
                document.getElementById('missing-word-game-screen').style.display = 'none';
                document.getElementById('missing-word-end-screen').style.display = 'flex';
            }, 1000);
        } else {
            inputs.forEach(i => {
                i.style.borderColor = '#ef4444';
                i.style.backgroundColor = '#fef2f2';
                i.style.color = '#b91c1c';
            });
            setTimeout(() => {
                inputs.forEach(i => {
                    i.style.borderColor = 'var(--color-border)';
                    i.style.backgroundColor = 'var(--color-surface)';
                    i.style.color = 'var(--color-text-main)';
                    i.value = '';
                });
                inputs[0].focus();
            }, 800);
        }
    }
};

window.giveMissingWordHint = function() {
    if (!window.missingWordAnswer) return;
    
    const inputsEl = document.getElementById('missing-word-inputs');
    if (!inputsEl) return;
    
    const inputs = Array.from(inputsEl.querySelectorAll('input'));
    const word = window.missingWordAnswer;
    
    // Find the first empty input, or the first incorrect input
    let targetIndex = -1;
    for (let i = 0; i < word.length; i++) {
        if (inputs[i].value === '' || inputs[i].value !== word[i]) {
            targetIndex = i;
            break;
        }
    }
    
    if (targetIndex !== -1) {
        inputs[targetIndex].value = word[targetIndex];
        // Focus the next empty input if possible
        const next = inputs.slice(targetIndex + 1).find(input => input.value === '');
        if (next) {
            next.focus();
        } else {
            inputs[targetIndex].blur();
        }
        
        // Flash blue to indicate hint
        inputs[targetIndex].style.transition = 'none';
        inputs[targetIndex].style.backgroundColor = '#e0f2fe';
        inputs[targetIndex].style.borderColor = '#3b82f6';
        
        setTimeout(() => {
            inputs[targetIndex].style.transition = 'all 0.2s';
            inputs[targetIndex].style.backgroundColor = 'var(--color-surface)';
            inputs[targetIndex].style.borderColor = 'var(--color-border)';
        }, 500);
        
        checkMissingWordCompletion();
    }
};

/* =========================================
   TIC-TAC-TOE GAME
========================================= */

window.ticTacToeBoard = ['', '', '', '', '', '', '', '', ''];
window.ticTacToeCurrentPlayer = 'X';
window.ticTacToeActive = false;
window.ticTacToeMode = '1player';

window.initTicTacToePage = function() {
    startTicTacToe('1player');
};

window.startTicTacToe = function(mode) {
    window.ticTacToeMode = mode;
    window.ticTacToeBoard = ['', '', '', '', '', '', '', '', ''];
    window.ticTacToeCurrentPlayer = 'X';
    window.ticTacToeActive = true;
    
    // Update button styles
    const btn1 = document.getElementById('mode-btn-1player');
    const btn2 = document.getElementById('mode-btn-2player');
    
    if (btn1 && btn2) {
        if (mode === '1player') {
            btn1.className = 'btn btn-primary';
            btn1.style.background = '';
            btn1.style.color = '';
            btn2.className = '';
            btn2.style.background = 'transparent';
            btn2.style.color = 'var(--color-text-muted)';
        } else {
            btn2.className = 'btn btn-primary';
            btn2.style.background = '';
            btn2.style.color = '';
            btn1.className = '';
            btn1.style.background = 'transparent';
            btn1.style.color = 'var(--color-text-muted)';
        }
    }
    
    document.getElementById('tic-tac-toe-game-screen').style.display = 'flex';
    document.getElementById('tic-tac-toe-end-screen').style.display = 'none';
    
    const status = document.getElementById('tic-tac-toe-status');
    if (status) status.innerText = "Player X's Turn";
    
    const cells = document.querySelectorAll('.tic-tac-toe-cell');
    cells.forEach(cell => {
        cell.innerText = '';
        cell.removeAttribute('data-value');
    });
};

window.handleTicTacToeClick = function(index) {
    // If it's single player mode and it's O's turn, ignore clicks
    if (window.ticTacToeMode === '1player' && window.ticTacToeCurrentPlayer === 'O') return;
    
    processTicTacToeMove(index);
};

window.processTicTacToeMove = function(index) {
    if (!window.ticTacToeActive) return;
    if (window.ticTacToeBoard[index] !== '') return;
    
    window.ticTacToeBoard[index] = window.ticTacToeCurrentPlayer;
    
    const cell = document.querySelector(`.tic-tac-toe-cell[data-index="${index}"]`);
    cell.innerHTML = `<span class="tic-tac-toe-symbol">${window.ticTacToeCurrentPlayer}</span>`;
    cell.setAttribute('data-value', window.ticTacToeCurrentPlayer);
    
    checkTicTacToeWin();
};

window.checkTicTacToeWin = function() {
    const b = window.ticTacToeBoard;
    const winConditions = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
        [0, 4, 8], [2, 4, 6]             // Diagonals
    ];
    
    let won = false;
    for (let i = 0; i < winConditions.length; i++) {
        const [p1, p2, p3] = winConditions[i];
        if (b[p1] && b[p1] === b[p2] && b[p1] === b[p3]) {
            won = true;
            break;
        }
    }
    
    if (won) {
        window.ticTacToeActive = false;
        showTicTacToeEndScreen(`Player ${window.ticTacToeCurrentPlayer} Wins!`);
        return;
    }
    
    if (!b.includes('')) {
        window.ticTacToeActive = false;
        showTicTacToeEndScreen("It's a Tie!");
        return;
    }
    
    // Switch turn
    window.ticTacToeCurrentPlayer = window.ticTacToeCurrentPlayer === 'X' ? 'O' : 'X';
    document.getElementById('tic-tac-toe-status').innerText = `Player ${window.ticTacToeCurrentPlayer}'s Turn`;
    
    if (window.ticTacToeMode === '1player' && window.ticTacToeCurrentPlayer === 'O') {
        makeTicTacToeComputerMove();
    }
};

window.makeTicTacToeComputerMove = function() {
    if (!window.ticTacToeActive || window.ticTacToeCurrentPlayer !== 'O') return;
    
    const b = window.ticTacToeBoard;
    const winConditions = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];
    
    const findMove = (player) => {
        for (let i = 0; i < winConditions.length; i++) {
            const [p1, p2, p3] = winConditions[i];
            const values = [b[p1], b[p2], b[p3]];
            if (values.filter(v => v === player).length === 2 && values.includes('')) {
                return [p1, p2, p3].find(p => b[p] === '');
            }
        }
        return -1;
    };
    
    let move = findMove('O');
    if (move === -1) move = findMove('X');
    if (move === -1 && b[4] === '') move = 4;
    
    if (move === -1) {
        const emptySpots = b.map((val, idx) => val === '' ? idx : -1).filter(val => val !== -1);
        if (emptySpots.length > 0) {
            move = emptySpots[Math.floor(Math.random() * emptySpots.length)];
        }
    }
    
    if (move !== -1) {
        setTimeout(() => {
            processTicTacToeMove(move);
        }, 600); // Small delay to feel natural
    }
};

window.showTicTacToeEndScreen = function(message) {
    setTimeout(() => {
        document.getElementById('tic-tac-toe-winner-text').innerText = message;
        if (message.includes('Tie')) {
            document.getElementById('tic-tac-toe-winner-icon').innerText = '🤝';
        } else {
            document.getElementById('tic-tac-toe-winner-icon').innerText = '🏆';
        }
        document.getElementById('tic-tac-toe-end-screen').style.display = 'flex';
    }, 300);
};

window.resetTicTacToe = function() {
    initTicTacToePage();
};

/* =========================================
   CAREER QUIZ GAME
========================================= */

window.careerQuizRounds = [];
window.careerQuizCurrentRound = 0;

window.initCareerQuizPage = function() {
    const container = document.getElementById('career-quiz-container');
    if (!container) return;

    try {
        const rawData = container.getAttribute('data-rounds');
        if (rawData) {
            window.careerQuizRounds = JSON.parse(rawData);
            window.careerQuizCurrentRound = 0;
            renderCareerQuizRound();
        }
    } catch (e) {
        console.error("Failed to parse career quiz rounds", e);
    }
};

window.renderCareerQuizRound = function() {
    const roundData = window.careerQuizRounds[window.careerQuizCurrentRound];
    if (!roundData) return;

    document.getElementById('career-quiz-round-counter').innerText = `Scenario ${window.careerQuizCurrentRound + 1} of 3`;
    document.getElementById('career-quiz-scenario').innerText = roundData.scenario;
    
    const optionsContainer = document.getElementById('career-quiz-options');
    optionsContainer.innerHTML = '';
    
    roundData.options.forEach((option, index) => {
        const btn = document.createElement('button');
        btn.className = 'career-quiz-option-btn';
        btn.innerHTML = `<span style="font-weight: bold; color: var(--color-primary); font-size: 1.2rem; min-width: 30px;">${String.fromCharCode(65 + index)}.</span> <span>${option}</span>`;
        btn.onclick = () => handleCareerQuizSelection(index, btn);
        optionsContainer.appendChild(btn);
    });

    document.getElementById('career-quiz-feedback').style.display = 'none';
};

window.handleCareerQuizSelection = function(selectedIndex, clickedBtn) {
    const roundData = window.careerQuizRounds[window.careerQuizCurrentRound];
    const correctIndex = roundData.correct_index;
    
    // Disable all buttons
    const buttons = document.querySelectorAll('.career-quiz-option-btn');
    buttons.forEach((btn, idx) => {
        btn.disabled = true;
        if (idx === correctIndex) {
            btn.classList.add('correct');
        } else if (idx === selectedIndex && selectedIndex !== correctIndex) {
            btn.classList.add('incorrect');
        }
    });

    // Show feedback
    const feedbackContainer = document.getElementById('career-quiz-feedback');
    const feedbackBox = document.getElementById('career-quiz-feedback-box');
    const title = document.getElementById('career-quiz-feedback-title');
    const text = document.getElementById('career-quiz-feedback-text');

    feedbackContainer.style.display = 'flex';
    text.innerText = roundData.explanation;

    if (selectedIndex === correctIndex) {
        feedbackBox.style.background = 'rgba(16, 185, 129, 0.1)';
        feedbackBox.style.border = '1px solid #10b981';
        title.innerHTML = '<span style="font-size: 1.5rem;">✅</span> <span style="color: #10b981;">Excellent Judgement!</span>';
    } else {
        feedbackBox.style.background = 'rgba(245, 158, 11, 0.1)';
        feedbackBox.style.border = '1px solid #f59e0b';
        // As requested by user: "That wasn't quite right. Let's reconsider the options if wrong."
        title.innerHTML = '<span style="font-size: 1.5rem;">🤔</span> <span style="color: #d97706;">That wasn\'t quite right. Let\'s reconsider the approach.</span>';
    }
};

window.nextCareerQuizRound = function() {
    window.careerQuizCurrentRound++;
    if (window.careerQuizCurrentRound < window.careerQuizRounds.length) {
        renderCareerQuizRound();
    } else {
        document.getElementById('career-quiz-end-screen').style.display = 'flex';
    }
};

/* =========================================
   WORD SEARCH GAME
========================================= */
window.wsGrid = [];
window.wsSize = 10;
window.wsWords = [];
window.wsFoundWords = [];
window.wsIsDragging = false;
window.wsStartCell = null;
window.wsCurrentSelection = [];

window.initWordSearchPage = function() {
    const container = document.getElementById('word-search-container');
    if (!container) return;

    try {
        const wordsRaw = container.getAttribute('data-words');
        if (wordsRaw) {
            window.wsWords = JSON.parse(wordsRaw).map(w => w.toUpperCase().replace(/[^A-Z]/g, ''));
            window.wsFoundWords = [];
            
            const diff = container.getAttribute('data-difficulty') || 'easy';
            window.wsSize = diff === 'hard' ? 20 : (diff === 'medium' ? 15 : 10);
            
            generateWordSearchGrid(diff);
            renderWordSearchGrid();
            renderWordSearchList();
        }
    } catch (e) {
        console.error("Word Search init error", e);
    }
};

function generateWordSearchGrid(diff) {
    // Initialize empty grid
    window.wsGrid = Array(window.wsSize).fill(null).map(() => Array(window.wsSize).fill(''));
    
    // Directions: [dx, dy]
    const dirs = {
        'easy': [[1,0], [0,1]], // Right, Down
        'medium': [[1,0], [0,1], [1,1], [1,-1]], // Right, Down, Diagonal
        'hard': [[1,0], [0,1], [1,1], [1,-1], [-1,0], [0,-1], [-1,-1], [-1,1]] // All 8
    }[diff];

    // Try to place each word
    window.wsWords.forEach(word => {
        let placed = false;
        let attempts = 0;
        
        while (!placed && attempts < 100) {
            const dir = dirs[Math.floor(Math.random() * dirs.length)];
            const r = Math.floor(Math.random() * window.wsSize);
            const c = Math.floor(Math.random() * window.wsSize);
            
            if (canPlaceWord(word, r, c, dir[0], dir[1])) {
                placeWord(word, r, c, dir[0], dir[1]);
                placed = true;
            }
            attempts++;
        }
    });

    // Fill remaining with random letters
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for(let r=0; r<window.wsSize; r++) {
        for(let c=0; c<window.wsSize; c++) {
            if(window.wsGrid[r][c] === '') {
                window.wsGrid[r][c] = alphabet[Math.floor(Math.random() * alphabet.length)];
            }
        }
    }
}

function canPlaceWord(word, r, c, dr, dc) {
    if (r + dr * word.length < -1 || r + dr * word.length > window.wsSize) return false;
    if (c + dc * word.length < -1 || c + dc * word.length > window.wsSize) return false;
    
    for (let i = 0; i < word.length; i++) {
        const nr = r + dr * i;
        const nc = c + dc * i;
        if (nr < 0 || nr >= window.wsSize || nc < 0 || nc >= window.wsSize) return false;
        if (window.wsGrid[nr][nc] !== '' && window.wsGrid[nr][nc] !== word[i]) return false;
    }
    return true;
}

function placeWord(word, r, c, dr, dc) {
    for (let i = 0; i < word.length; i++) {
        window.wsGrid[r + dr * i][c + dc * i] = word[i];
    }
}

function renderWordSearchGrid() {
    const gridEl = document.getElementById('word-search-grid');
    gridEl.style.gridTemplateColumns = `repeat(${window.wsSize}, 1fr)`;
    gridEl.innerHTML = '';
    
    // Reset selection state on re-render
    window.wsStartCell = null;
    
    for(let r=0; r<window.wsSize; r++) {
        for(let c=0; c<window.wsSize; c++) {
            const cell = document.createElement('div');
            cell.className = 'ws-cell';
            cell.dataset.r = r;
            cell.dataset.c = c;
            cell.innerText = window.wsGrid[r][c];
            
            // Mouse events for Two-Tap selection
            cell.addEventListener('click', (e) => {
                e.preventDefault();
                
                // If first tap
                if (!window.wsStartCell) {
                    window.wsStartCell = [r, c];
                    cell.classList.add('highlighted');
                } 
                // If second tap on same cell (cancel)
                else if (window.wsStartCell[0] === r && window.wsStartCell[1] === c) {
                    window.wsStartCell = null;
                    cell.classList.remove('highlighted');
                }
                // If second tap on different cell (evaluate line)
                else {
                    updateWsSelection(r, c);
                    endWsSelection();
                }
            });
            
            gridEl.appendChild(cell);
        }
    }
}

function renderWordSearchList() {
    const listEl = document.getElementById('word-search-list');
    listEl.innerHTML = '';
    window.wsWords.forEach(word => {
        const div = document.createElement('div');
        div.className = 'ws-word-item';
        div.id = `ws-word-${word}`;
        div.innerText = word;
        if (window.wsFoundWords.includes(word)) {
            div.classList.add('found');
        }
        listEl.appendChild(div);
    });
}

function updateWsSelection(endR, endC) {
    // Clear previous highlight (but not found)
    document.querySelectorAll('.ws-cell.highlighted').forEach(c => c.classList.remove('highlighted'));
    
    if (!window.wsStartCell) return;
    
    const [sr, sc] = window.wsStartCell;
    const dr = endR - sr;
    const dc = endC - sc;
    
    // Enforce straight lines
    const maxDist = Math.max(Math.abs(dr), Math.abs(dc));
    let stepR = dr === 0 ? 0 : dr / Math.abs(dr);
    let stepC = dc === 0 ? 0 : dc / Math.abs(dc);
    
    // Only allow perfectly straight or 45-degree diagonal lines
    if (Math.abs(dr) !== 0 && Math.abs(dc) !== 0 && Math.abs(dr) !== Math.abs(dc)) {
        return; // invalid line, will result in empty selection and fail validation
    }
    
    window.wsCurrentSelection = [];
    for(let i=0; i<=maxDist; i++) {
        const r = sr + (stepR * i);
        const c = sc + (stepC * i);
        window.wsCurrentSelection.push([r, c]);
        const cell = document.querySelector(`.ws-cell[data-r="${r}"][data-c="${c}"]`);
        if(cell) cell.classList.add('highlighted');
    }
}

function endWsSelection() {
    if (window.wsCurrentSelection.length < 1) {
        // If invalid line or too short, just clear highlight and reset
        document.querySelectorAll('.ws-cell.highlighted').forEach(c => c.classList.remove('highlighted'));
        window.wsCurrentSelection = [];
        window.wsStartCell = null;
        return;
    }
    
    // Build word from selection
    let selectedWord = "";
    window.wsCurrentSelection.forEach(([r, c]) => {
        selectedWord += window.wsGrid[r][c];
    });
    
    let reversedWord = selectedWord.split('').reverse().join('');
    
    let foundStr = null;
    if (window.wsWords.includes(selectedWord) && !window.wsFoundWords.includes(selectedWord)) {
        foundStr = selectedWord;
    } else if (window.wsWords.includes(reversedWord) && !window.wsFoundWords.includes(reversedWord)) {
        foundStr = reversedWord;
    }
    
    if (foundStr) {
        window.wsFoundWords.push(foundStr);
        // Mark grid cells as found
        window.wsCurrentSelection.forEach(([r, c]) => {
            const cell = document.querySelector(`.ws-cell[data-r="${r}"][data-c="${c}"]`);
            if(cell) cell.classList.add('found');
        });
        // Update list
        renderWordSearchList();
        
        // Check win condition
        if (window.wsFoundWords.length === window.wsWords.length) {
            setTimeout(() => {
                document.getElementById('word-search-end-screen').style.display = 'flex';
            }, 500);
        }
    }
    
    // Clear highlight and reset state
    document.querySelectorAll('.ws-cell.highlighted').forEach(c => c.classList.remove('highlighted'));
    window.wsCurrentSelection = [];
    window.wsStartCell = null;
}

/* =========================================
   CREATE A STORY GAME
========================================= */
window.storyGameMode = 'computer'; // 'computer' or 'friend'
window.storyHistory = [];
window.storyCurrentPlayer = 1;

window.initStoryGame = function() {
    window.storyHistory = [];
    window.storyCurrentPlayer = 1;
    
    // Auto-fetch if on setup screen
    const setupScreen = document.getElementById('story-setup-screen');
    if (setupScreen && setupScreen.style.display !== 'none') {
        window.fetchStoryPrompts();
    }
};

window.setStoryMode = function(mode) {
    window.storyGameMode = mode;
    const btnComp = document.getElementById('mode-btn-computer');
    const btnFriend = document.getElementById('mode-btn-friend');
    
    if (btnComp && btnFriend) {
        if (mode === 'computer') {
            btnComp.style.background = 'var(--color-primary)';
            btnComp.style.color = 'white';
            btnFriend.style.background = 'transparent';
            btnFriend.style.color = 'var(--color-text-muted)';
        } else {
            btnFriend.style.background = 'var(--color-primary)';
            btnFriend.style.color = 'white';
            btnComp.style.background = 'transparent';
            btnComp.style.color = 'var(--color-text-muted)';
        }
    }
};

window.fetchStoryPrompts = async function() {
    const loading = document.getElementById('story-prompts-loading');
    const container = document.getElementById('story-prompts-container');
    const list = document.getElementById('story-prompts-list');
    
    if (!loading || !container || !list) return;
    
    loading.style.display = 'block';
    container.style.display = 'none';
    list.innerHTML = '';
    
    try {
        const response = await fetch('/api/story/prompts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            }
        });
        const data = await response.json();
        
        data.prompts.forEach(prompt => {
            const btn = document.createElement('button');
            btn.className = 'story-prompt-card';
            btn.innerText = prompt;
            btn.onclick = () => startStoryGame(prompt);
            list.appendChild(btn);
        });
        
        loading.style.display = 'none';
        container.style.display = 'block';
    } catch (e) {
        console.error("Failed to fetch prompts", e);
        loading.style.display = 'none';
        alert("Failed to load prompts. Please refresh to try again.");
    }
};

window.startStoryGame = function(initialPrompt) {
    window.storyHistory.push(initialPrompt);
    document.getElementById('story-setup-screen').style.display = 'none';
    document.getElementById('story-game-screen').style.display = 'flex';
    updateStoryTurnIndicator();
};

window.updateStoryTurnIndicator = function() {
    const indicator = document.getElementById('story-turn-indicator');
    const inputArea = document.getElementById('story-input-area');
    const thinking = document.getElementById('story-computer-thinking');
    
    if (window.storyGameMode === 'computer') {
        if (window.storyCurrentPlayer === 1) {
            indicator.innerText = "Your Turn";
            indicator.style.color = "var(--color-primary)";
            indicator.style.background = "rgba(99, 102, 241, 0.1)";
            inputArea.style.display = 'flex';
            thinking.style.display = 'none';
        } else {
            indicator.innerText = "Computer's Turn";
            indicator.style.color = "#8B5CF6";
            indicator.style.background = "rgba(139, 92, 246, 0.1)";
            inputArea.style.display = 'none';
            thinking.style.display = 'flex';
            triggerComputerTurn();
        }
    } else {
        indicator.innerText = `Player ${window.storyCurrentPlayer}'s Turn`;
        indicator.style.color = window.storyCurrentPlayer === 1 ? "var(--color-primary)" : "#F59E0B";
        indicator.style.background = window.storyCurrentPlayer === 1 ? "rgba(99, 102, 241, 0.1)" : "rgba(245, 158, 11, 0.1)";
        inputArea.style.display = 'flex';
        thinking.style.display = 'none';
    }
};

window.submitStoryTurn = function() {
    const input = document.getElementById('story-input');
    const text = input.value.trim();
    
    if (!text) return;
    
    window.storyHistory.push(text);
    input.value = '';
    
    // Pass turn
    window.storyCurrentPlayer = window.storyCurrentPlayer === 1 ? 2 : 1;
    updateStoryTurnIndicator();
};

window.triggerComputerTurn = async function() {
    try {
        const response = await fetch('/api/story/ai_turn', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            },
            body: JSON.stringify({ history: window.storyHistory })
        });
        const data = await response.json();
        
        if (data.sentence) {
            window.storyHistory.push(data.sentence);
        }
    } catch (e) {
        console.error("AI turn failed", e);
        window.storyHistory.push("Suddenly, a loud noise distracted everyone.");
    }
    
    // Pass turn back to user
    window.storyCurrentPlayer = 1;
    updateStoryTurnIndicator();
};

window.endStoryGame = function() {
    document.getElementById('story-game-screen').style.display = 'none';
    document.getElementById('story-reveal-screen').style.display = 'flex';
    
    const finalTextEl = document.getElementById('story-final-text');
    finalTextEl.innerText = window.storyHistory.join(" ");
    
    // Auto-read
    window.readStoryAloud();
};

window.readStoryAloud = function() {
    if (!('speechSynthesis' in window)) {
        alert("Your browser does not support text-to-speech.");
        return;
    }
    
    const text = window.storyHistory.join(" ");
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
};

/* =========================================
   PHOTO TRIVIA GAME
========================================= */
window.ptRounds = [];
window.ptCurrentRound = 0;
window.ptScore = 0;
window.ptIsAnimating = false;

window.initPhotoTriviaPage = function() {
    const container = document.getElementById('photo-trivia-container');
    if (!container) return;
    
    try {
        const raw = container.getAttribute('data-rounds');
        if (raw) {
            window.ptRounds = JSON.parse(raw);
            window.ptCurrentRound = 0;
            window.ptScore = 0;
            if (window.ptRounds && window.ptRounds.length > 0) {
                renderPhotoTriviaRound();
            }
        }
    } catch (e) {
        console.error("Photo Trivia init error", e);
    }
};

function renderPhotoTriviaRound() {
    if (window.ptCurrentRound >= window.ptRounds.length) {
        document.getElementById('photo-trivia-container').style.display = 'none';
        document.getElementById('photo-trivia-end-screen').style.display = 'flex';
        document.getElementById('pt-score-text').innerText = `You remembered ${window.ptScore} out of ${window.ptRounds.length} memories!`;
        return;
    }
    
    window.ptIsAnimating = false;
    const roundData = window.ptRounds[window.ptCurrentRound];
    
    document.getElementById('pt-round-indicator').innerText = `Round ${window.ptCurrentRound + 1} / ${window.ptRounds.length}`;
    document.getElementById('pt-photo').src = roundData.image_url;
    
    const feedback = document.getElementById('pt-feedback');
    feedback.style.display = 'none';
    feedback.className = '';
    
    const optionsContainer = document.getElementById('pt-options');
    optionsContainer.innerHTML = '';
    
    roundData.options.forEach(optText => {
        const btn = document.createElement('button');
        btn.className = 'pt-option-btn';
        btn.innerText = optText;
        btn.onclick = () => handlePhotoTriviaAnswer(optText, roundData.correct, btn);
        optionsContainer.appendChild(btn);
    });
}

function handlePhotoTriviaAnswer(selectedText, correctText, btnEl) {
    if (window.ptIsAnimating) return;
    window.ptIsAnimating = true;
    
    const feedback = document.getElementById('pt-feedback');
    feedback.style.display = 'block';
    
    // Highlight correct answer no matter what
    const allBtns = document.querySelectorAll('.pt-option-btn');
    allBtns.forEach(b => {
        if (b.innerText === correctText) b.classList.add('correct');
        b.style.pointerEvents = 'none';
    });
    
    if (selectedText === correctText) {
        window.ptScore++;
        feedback.innerText = "Correct! Spot on memory.";
        feedback.style.background = "#d1fae5";
        feedback.style.color = "#065f46";
        feedback.style.border = "1px solid #10b981";
    } else {
        btnEl.classList.add('wrong');
        feedback.innerText = "Not quite! Let's try the next one.";
        feedback.style.background = "#fee2e2";
        feedback.style.color = "#991b1b";
        feedback.style.border = "1px solid #ef4444";
    }
    
    setTimeout(() => {
        window.ptCurrentRound++;
        renderPhotoTriviaRound();
    }, 2500);
}

/* =========================================
   CRITICAL THINKING GAME
========================================= */
window.ctRounds = [];
window.ctCurrentRound = 0;
window.ctScore = 0;
window.ctIsAnimating = false;

window.initCriticalThinkingPage = function() {
    const container = document.getElementById('ct-game-container');
    if (!container) return;
    
    // Check if we need to fetch live data (cache miss)
    const raw = container.getAttribute('data-rounds');
    if (raw && raw !== '') {
        try {
            window.ctRounds = JSON.parse(raw);
            startCriticalThinkingGame();
        } catch (e) {
            console.error(e);
        }
    } else {
        // Cache miss on load, fetch from api using current select value
        const diff = document.getElementById('ct-difficulty-select').value;
        fetchCriticalThinkingData(diff);
    }
};

window.changeCriticalThinkingDifficulty = function(diff) {
    document.getElementById('ct-game-container').style.display = 'none';
    document.getElementById('ct-end-screen').style.display = 'none';
    document.getElementById('ct-loading').style.display = 'block';
    
    // Update URL quietly to remember difficulty on refresh
    const url = new URL(window.location);
    url.searchParams.set('difficulty', diff);
    window.history.pushState({}, '', url);
    
    fetchCriticalThinkingData(diff);
};

window.fetchCriticalThinkingData = async function(difficulty) {
    try {
        const response = await fetch('/api/games/generate_critical_thinking', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            },
            body: JSON.stringify({ difficulty: difficulty })
        });
        
        const data = await response.json();
        if (data.success && data.rounds) {
            window.ctRounds = data.rounds;
            startCriticalThinkingGame();
        } else {
            alert("Failed to generate puzzles. Please try again.");
            document.getElementById('ct-loading').innerText = "Error loading puzzles.";
        }
    } catch(e) {
        console.error(e);
        alert("Failed to connect.");
    }
};

function startCriticalThinkingGame() {
    document.getElementById('ct-loading').style.display = 'none';
    document.getElementById('ct-end-screen').style.display = 'none';
    document.getElementById('ct-game-container').style.display = 'flex';
    
    window.ctCurrentRound = 0;
    window.ctScore = 0;
    
    if (window.ctRounds && window.ctRounds.length > 0) {
        renderCriticalThinkingRound();
    }
}

function renderCriticalThinkingRound() {
    if (window.ctCurrentRound >= window.ctRounds.length) {
        document.getElementById('ct-game-container').style.display = 'none';
        document.getElementById('ct-end-screen').style.display = 'flex';
        document.getElementById('ct-score-text').innerText = `You scored ${window.ctScore} out of ${window.ctRounds.length}!`;
        return;
    }
    
    window.ctIsAnimating = false;
    const roundData = window.ctRounds[window.ctCurrentRound];
    
    document.getElementById('ct-round-indicator').innerText = `Round ${window.ctCurrentRound + 1} / ${window.ctRounds.length}`;
    document.getElementById('ct-question-text').innerText = roundData.question;
    
    const feedback = document.getElementById('ct-feedback');
    feedback.style.display = 'none';
    feedback.className = '';
    
    const optionsContainer = document.getElementById('ct-options');
    optionsContainer.innerHTML = '';
    
    roundData.options.forEach(optText => {
        const btn = document.createElement('button');
        btn.className = 'ct-option-btn';
        btn.innerText = optText;
        btn.onclick = () => handleCriticalThinkingAnswer(optText, roundData.correct, btn);
        optionsContainer.appendChild(btn);
    });
}

function handleCriticalThinkingAnswer(selectedText, correctText, btnEl) {
    if (window.ctIsAnimating) return;
    window.ctIsAnimating = true;
    
    const feedback = document.getElementById('ct-feedback');
    feedback.style.display = 'block';
    
    // Highlight correct answer
    const allBtns = document.querySelectorAll('.ct-option-btn');
    allBtns.forEach(b => {
        if (b.innerText === correctText) b.classList.add('correct');
        b.style.pointerEvents = 'none';
    });
    
    if (selectedText === correctText) {
        window.ctScore++;
        feedback.innerText = "Correct! Sharp thinking.";
        feedback.style.background = "#d1fae5";
        feedback.style.color = "#065f46";
        feedback.style.border = "1px solid #10b981";
    } else {
        btnEl.classList.add('wrong');
        feedback.innerText = "Not quite! Look closely at the correct answer.";
        feedback.style.background = "#fee2e2";
        feedback.style.color = "#991b1b";
        feedback.style.border = "1px solid #ef4444";
    }
    
    setTimeout(() => {
        window.ctCurrentRound++;
        renderCriticalThinkingRound();
    }, 2500);
}

/* =========================================
   LET'S TALK GAME
========================================= */
window.ltPrompts = [];
window.ltCurrentIndex = 0;

window.initLetsTalkPage = function() {
    const container = document.getElementById('lt-container');
    if (!container) return;
    
    const raw = container.getAttribute('data-prompts');
    if (raw && raw !== '') {
        try {
            window.ltPrompts = JSON.parse(raw);
            if (window.ltPrompts.length > 0) {
                window.ltCurrentIndex = 0;
                renderLetsTalkPrompt();
            }
        } catch (e) {
            console.error(e);
        }
    }
};

function renderLetsTalkPrompt() {
    if (window.ltCurrentIndex >= window.ltPrompts.length) {
        document.getElementById('lt-container').style.display = 'none';
        document.getElementById('lt-end-screen').style.display = 'flex';
        return;
    }
    
    document.getElementById('lt-round-indicator').innerText = `Topic ${window.ltCurrentIndex + 1} / ${window.ltPrompts.length}`;
    const promptText = `"${window.ltPrompts[window.ltCurrentIndex]}"`;
    document.getElementById('lt-prompt-text').innerText = promptText;
    
    // Automatically read it out loud
    playTTS(window.ltPrompts[window.ltCurrentIndex]);
}

window.fetchMoreLetsTalkPrompts = async function() {
    document.getElementById('lt-round-indicator').innerText = "Generating more topics...";
    document.getElementById('lt-prompt-text').innerText = "Please wait a moment while the AI thinks...";
    
    try {
        const response = await fetch('/api/games/generate_lets_talk', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            }
        });
        
        const data = await response.json();
        if (data.success && data.prompts) {
            window.ltPrompts = window.ltPrompts.concat(data.prompts);
            renderLetsTalkPrompt();
        } else {
            document.getElementById('lt-prompt-text').innerText = "Failed to load more topics. Please refresh.";
        }
    } catch(e) {
        console.error(e);
        document.getElementById('lt-prompt-text').innerText = "Connection error. Please refresh.";
    }
};

window.nextLetsTalkPrompt = function() {
    window.speechSynthesis.cancel(); // Stop current speech if any
    window.ltCurrentIndex++;
    renderLetsTalkPrompt();
};

window.replayLetsTalkPrompt = function() {
    window.speechSynthesis.cancel();
    playTTS(window.ltPrompts[window.ltCurrentIndex]);
};

// Generic TTS helper (already partially used in Create a Story, but we redefine cleanly)
function playTTS(text) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9; // Slightly slower for clarity
        window.speechSynthesis.speak(utterance);
    }
}
