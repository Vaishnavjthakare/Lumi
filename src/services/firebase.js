import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDmPYTmicOI-DpmBOqm6-2tIMUd2KZmBKs",
    authDomain: "hackathon-cbf17.firebaseapp.com",
    projectId: "hackathon-cbf17",
    storageBucket: "hackathon-cbf17.firebasestorage.app",
    messagingSenderId: "144120189819",
    appId: "1:144120189819:web:e62ddaacab4d6fc05523de"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Authentication and get a reference to the service
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Configure the provider with your specific Client ID to fix the "Invalid Request" error
googleProvider.setCustomParameters({
    prompt: 'select_account',
    client_id: '157874607553-delh16taukdul9ll3i6m177jp6vb2n08.apps.googleusercontent.com'
});

export const githubProvider = new GithubAuthProvider();

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;
