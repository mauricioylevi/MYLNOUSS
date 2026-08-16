---
name: start-server
description: "Starts the Rails server when the user types /start-server"
---

# Custom Slash Command: /start-server

Whenever the user's prompt consists of or contains the command `/start-server`, you must immediately use your `run_command` tool to start the Rails server.

**Action to take:**
Execute `rails s -p 3001` as a daemon (in the background) using the `run_command` tool in the `mylnouss_core` directory.

After executing, inform the user that the server is successfully running in the background on port 3001. Do not ask for permission or plan the execution, simply execute it.
