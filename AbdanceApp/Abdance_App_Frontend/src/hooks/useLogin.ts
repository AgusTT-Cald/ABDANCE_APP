import { getIdToken, signInWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import { auth, db } from "../firebase-config"


export const useLogin= () =>{

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const login = async(email:string, password:string) =>{
        
        //se setea el loading en true y el error en null.
        setLoading(true);
        setError(null);
        
        //se usa un try-catch para intentar iniciar sesion:
        try{
            const credencialUsuario = await signInWithEmailAndPassword(auth,email, password); //se inicia sesion con las credenciales del usuario
            const usuario = credencialUsuario.user;//se obtiene el usuario asociado con el token
            const bearerToken = await getIdToken(usuario);
            

            //se guarda el token en la localstorage
            localStorage.setItem("token", bearerToken);
        
            
            
            return { usuario, bearerToken }; 

        }catch(error:any){
            // setError(error.message);
            // if (error.message == "Firebase: Error (auth/invalid-credential)."){
            //     setError("El email o contraseña son incorrectos")
            // }
            console.error("Error en login:", error.code, error.message);
            switch (error.code) {
                case "auth/user-not-found":
                    setError("El email o contraseña son incorrectas");
                    break;
                case "auth/wrong-password":
                    setError(" El email o contraseña son incorrectas");
                    break;
                case "auth/invalid-email":
                    setError("Correo inválido o contraseña incorrecta");
                    break;
                case "auth/invalid-credential":
                    setError("El email o contraseña son incorrectos");
                    break;
                default:
                    setError("Error al iniciar sesión. Intenta nuevamente.");
            }

            return false;
        }finally{
            setLoading(false);
        }
    };
    return {login, loading, error};
}

import { collection, getDocs, query, where } from "firebase/firestore";


export const getRole = async(usuarioUid: string):  Promise <string | null> => {
    try {
        const usersRef = collection(db, "usuarios");
        const q = query(usersRef, where("user_uid", "==", usuarioUid));
        const querySnapshot = await getDocs(q);


        if (!querySnapshot.empty) {

            const userDoc = querySnapshot.docs[0];//se piensa que solo hay un documento
            const data = userDoc.data();
            return data.rol || null;

        } else {
        console.warn("No existe el documento del usuario");
        return null;
        }
    } catch (error) {
        console.error("Error obteniendo el rol:", error);
        return null;
    }
};


export const getDNI = async(usuarioUid: string):  Promise <string | null> => {
    try {
        const usersRef = collection(db, "usuarios");
        const q = query(usersRef, where("user_uid", "==", usuarioUid));
        const querySnapshot = await getDocs(q);


        if (!querySnapshot.empty) {

            const userDoc = querySnapshot.docs[0];//se piensa que solo hay un documento
            const data = userDoc.data();
            return data.dni ?? null;

        } else {
        console.warn("No existe el documento del usuario");
        return null;
        }
    } catch (error) {
        console.error("Error obteniendo el DNI:", error);
        return null;
    }
};