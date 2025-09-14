// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBFbL5joLU8VXgxAw8b3xOUd40fKhKxgq8",
    authDomain: "portfolio-1a176.firebaseapp.com",
    projectId: "portfolio-1a176",
    storageBucket: "portfolio-1a176.firebasestorage.app",
    messagingSenderId: "831559911908",
    appId: "1:831559911908:web:21d5c284f133a7f2c5dff1",
    measurementId: "G-PZJVZDR95K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);