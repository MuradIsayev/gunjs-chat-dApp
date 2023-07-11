import GUN from 'gun';
import 'gun/sea'; // Security, Encryption, Authorization, enables user authentication
import 'gun/axe'; // Advanced Exchange Equation, Connects to other peers, enables peer-to-peer communication
import { Writable } from 'svelte/store'; // Svelte store, enables state management across components

// Database
export const db = GUN();

// User
export const user = db.user().recall({ sessionStorage: true });

// Current User's username
export const username = writable('');

user.get('alias').on((alias) => { username.set(alias); }); // Update username when alias changes (alias is the username)    

db.on('auth', async (event) => { // When user is authenticated (logged in)
    const alias = await user.get('alias'); // Get username
    username.set(alias); // Set username 

    console.log(`Authenticated as ${alias}`);
});
