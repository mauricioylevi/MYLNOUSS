// MYLNOUSS Application Entry Point

let currentStep = 1;
const totalSteps = 7;
let hasUnsavedChanges = false;

document.addEventListener('DOMContentLoaded', () => {
    console.log('MYLNOUSS application initialized successfully.');
    
    // Add event listeners for selection cards to toggle 'selected' class visually
    const selectionInputs = document.querySelectorAll('.selection-card input');
    selectionInputs.forEach(input => {
        input.addEventListener('change', function() {
            // If it's a radio button, clear 'selected' from other cards in the same group
            if (this.type === 'radio') {
                const groupName = this.name;
                const siblings = document.querySelectorAll(`input[name="${groupName}"]`);
                siblings.forEach(sibling => {
                    sibling.closest('.selection-card').classList.remove('selected');
                });
            }
            
            // Toggle current card
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
    
    // Load existing profile data if available
    loadProfileData();
});

// Open Questionnaire Modal
window.openProfileQuestionnaire = function(e) {
    if(e) e.preventDefault();
    document.getElementById('questionnaire-modal').classList.add('active');
    hasUnsavedChanges = false; // reset tracking when opening
    updateQuestionnaireView();
};

// Close Questionnaire Modal
window.closeProfileQuestionnaire = function() {
    if (hasUnsavedChanges) {
        const wantToSave = confirm("You have unsaved changes. Would you like to save them before exiting?");
        if (wantToSave) {
            saveProfileData();
            alert("Profile successfully saved locally in MYLNOUSS!");
        }
    }
    document.getElementById('questionnaire-modal').classList.remove('active');
    
    // Reset to step 1 for the next time it opens
    currentStep = 1;
    hasUnsavedChanges = false;
};

// Handle top bar save button
window.handleGlobalSave = function() {
    saveProfileData();
    hasUnsavedChanges = false;
    alert("Profile successfully saved locally in MYLNOUSS!");
    closeProfileQuestionnaire(); // Go back to main menu
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

// Global array of permanently saved photos - load from localStorage if available
window.savedMemoryPhotos = JSON.parse(localStorage.getItem('mylnouss_photos') || '[]');

// Open Photo Modal
window.openPhotoModal = function(e) {
    if(e) e.preventDefault();
    document.getElementById('photo-upload-modal').classList.add('active');
};

// Close Photo Modal
window.closePhotoModal = function() {
    document.getElementById('photo-upload-modal').classList.remove('active');
};

// Open Photo Gallery Modal
window.openGalleryModal = function(e) {
    if (e) e.preventDefault();
    const modal = document.getElementById('gallery-modal');
    const wrapper = document.getElementById('gallery-items-wrapper');
    const emptyMsg = document.getElementById('gallery-empty-msg');
    
    wrapper.innerHTML = '';
    
    if (window.savedMemoryPhotos.length === 0) {
        emptyMsg.style.display = 'block';
    } else {
        emptyMsg.style.display = 'none';
        
        window.savedMemoryPhotos.forEach(photo => {
            const card = document.createElement('div');
            card.style.cssText = 'background: var(--color-card-bg); border-radius: 12px; overflow: hidden; box-shadow: var(--shadow-sm); border: 1px solid var(--color-border);';
            
            const img = document.createElement('img');
            img.src = photo.src;
            img.style.cssText = 'width: 100%; height: 250px; object-fit: cover; display: block; border-bottom: 1px solid var(--color-border);';
            
            const textWrap = document.createElement('div');
            textWrap.style.cssText = 'padding: 1.5rem;';
            
            const desc = document.createElement('p');
            desc.style.cssText = 'margin: 0; font-size: 1.1rem; color: var(--color-text-main); font-weight: 500; line-height: 1.5;';
            desc.innerText = photo.description || 'No description provided.';
            
            textWrap.appendChild(desc);
            card.appendChild(img);
            card.appendChild(textWrap);
            wrapper.appendChild(card);
        });
    }
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
};

// Close Photo Gallery Modal
window.closeGalleryModal = function(e) {
    if(e) e.preventDefault();
    document.getElementById('gallery-modal').classList.remove('active');
    document.body.style.overflow = 'auto';
};

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
            let fingerprint = `${file.name}-${file.size}-${file.lastModified}`;
            
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
                warningText.innerText = `${duplicatesSkipped} duplicate photo(s) skipped to prevent clutter.`;
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
                let names = window.currentValidFiles.map(f => f.name).join(', ');
                namesLabel.innerText = names;
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
    
    // Hide empty message
    document.getElementById('no-photos-msg').style.display = 'none';
    
    const itemsWrapper = document.getElementById('photo-items-wrapper');
    const input = document.getElementById('imagesInput');
    const uploadBtn = document.getElementById('uploadBtn');
    
    // Process each valid file
    window.currentValidFiles.forEach((file, index) => {
        let fingerprint = `${file.name}-${file.size}-${file.lastModified}`;
        window.uploadedPhotoRegistry.push(fingerprint);
        
        photoIdCounter++;
        const currentId = photoIdCounter;

        const reader = new FileReader();
        reader.onload = function(e) {
            // Build the exact MindSpring DOM layout
            const card = document.createElement('div');
            card.className = 'ms-photo-card';
            card.id = `ms-card-${currentId}`;
            
            // Left: Image
            const imgContainer = document.createElement('div');
            imgContainer.style.width = '100%';
            imgContainer.style.height = '100%';
            
            const img = document.createElement('img');
            img.src = e.target.result;
            img.style.cssText = 'width: 100%; height: 100%; min-height: 250px; object-fit: cover; border-radius: 8px; box-shadow: var(--shadow-sm);';
            imgContainer.appendChild(img);
            
            // Right: Form
            const formContainer = document.createElement('div');
            formContainer.style.display = 'flex';
            formContainer.style.flexDirection = 'column';
            formContainer.style.justifyContent = 'space-between';
            
            // Textarea Area
            const formGroup = document.createElement('div');
            formGroup.className = 'form-group';
            
            const headerFlex = document.createElement('div');
            headerFlex.style.cssText = 'display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 0.75rem;';
            
            const label = document.createElement('label');
            label.style.cssText = 'font-weight: 900; font-size: 0.95rem; color: var(--color-text-main);';
            label.innerHTML = `Step 2: Add Description <span style="color: var(--color-warning); font-size: 0.85rem; font-weight: 700; margin-left: 0.5rem;">(Message mandatory)</span>`;
            
            const charCount = document.createElement('span');
            charCount.id = `char_count_${currentId}`;
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
            
            // Buttons Area
            const buttonsArea = document.createElement('div');
            buttonsArea.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-top: 1.5rem; border-top: 1px solid var(--color-border); padding-top: 1.5rem;';
            
            const saveBtn = document.createElement('button');
            saveBtn.className = 'btn btn-primary';
            saveBtn.innerText = 'Save Changes';
            saveBtn.style.cssText = 'padding: 0.6rem 1.5rem; font-size: 1rem; font-weight: 700; border-radius: 8px; opacity: 0.5; cursor: not-allowed; transition: all 0.2s ease;';
            saveBtn.disabled = true;
            saveBtn.onclick = function() {
                saveBtn.innerText = 'Saved!';
                saveBtn.style.opacity = '1';
                
                // Store the photo data globally
                window.savedMemoryPhotos.push({
                    src: img.src,
                    description: textarea.value.trim()
                });
                
                try {
                    localStorage.setItem('mylnouss_photos', JSON.stringify(window.savedMemoryPhotos));
                } catch(e) {
                    console.warn("Could not save to localStorage (file too large). Kept in memory.");
                }
                
                // Add fade out transition
                card.style.transition = 'all 0.4s ease';
                
                setTimeout(() => {
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.95)';
                    
                    setTimeout(() => {
                        card.remove();
                        // Check if it's the last card
                        if(document.querySelectorAll('.ms-photo-card').length === 0) {
                            const emptyMsg = document.getElementById('no-photos-msg');
                            emptyMsg.innerHTML = '<p style="font-size: 1.25rem;">All photos saved successfully!</p><p>Use the form on the left to upload another batch.</p>';
                            emptyMsg.style.display = 'block';
                        }
                    }, 400); // wait for CSS transition to finish
                }, 500); // show "Saved!" for half a second
            };
            
            buttonsArea.appendChild(saveBtn);
            
            // Delete Area
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'ms-delete-btn';
            deleteBtn.innerText = 'Delete Photo';
            deleteBtn.onclick = function() {
                if(confirm('Are you sure you want to delete this memory?')) {
                    // Remove from registry so they can upload it again if they made a mistake
                    let fIndex = window.uploadedPhotoRegistry.indexOf(fingerprint);
                    if(fIndex > -1) window.uploadedPhotoRegistry.splice(fIndex, 1);
                    
                    card.remove();
                    if(document.querySelectorAll('.ms-photo-card').length === 0) {
                        document.getElementById('no-photos-msg').style.display = 'block';
                    }
                }
            };
            
            buttonsArea.appendChild(deleteBtn);
            
            formContainer.appendChild(formGroup);
            formContainer.appendChild(buttonsArea);
            
            card.appendChild(imgContainer);
            card.appendChild(formContainer);
            itemsWrapper.prepend(card); // newest at top
            
            // Logic for char counting and button enabling
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
        reader.readAsDataURL(file);
    });
    
    // Reset input
    input.value = '';
    uploadBtn.disabled = true;
    uploadBtn.style.opacity = '0.5';
    uploadBtn.style.cursor = 'not-allowed';
    
    const namesLabel = document.getElementById('custom-file-name');
    if (namesLabel) {
        namesLabel.innerText = 'No file chosen';
        namesLabel.style.color = 'var(--color-text-muted)';
    }
    
    const warningBlock = document.getElementById('duplicate-warning-msg');
    if (warningBlock) warningBlock.style.display = 'none';
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
}

// Load profile from LocalStorage
function loadProfileData() {
    const savedData = localStorage.getItem('mylnouss_user_profile');
    if (!savedData) return;

    try {
        const profileData = JSON.parse(savedData);

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
