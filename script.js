/**
 * Script pentru aplicația de criptare AES + Triple DES cu coduri QR
 * Acest script implementează o dublă criptare, aplicând mai întâi AES, apoi Triple DES
 * pentru o securitate mai robustă.
 */

// Așteptăm încărcarea completă a paginii înainte de a executa codul
document.addEventListener("DOMContentLoaded", function() {
    console.log("DOM încărcat complet. Inițializez aplicația...");
    
    // Verificăm existența formularului de criptare
    const encryptForm = document.getElementById("encryptForm");
    if (!encryptForm) {
        console.error("EROARE CRITICĂ: Formularul #encryptForm nu există în pagină!");
        alert("Eroare la inițializarea aplicației. Elementele necesare lipsesc.");
        return;
    }
    
    // Adăugăm handler pentru submisia formularului
    encryptForm.addEventListener("submit", function(e) {
        e.preventDefault();
        console.log("Formular trimis. Inițiez procesul de criptare...");
        
        // Obținem elementele necesare
        const textInput = document.getElementById("textToEncrypt");
        const keyInput = document.getElementById("keyEncrypt");
        const qrcodeDiv = document.getElementById("qrcode");
        
        // Verificăm dacă elementele esențiale există
        if (!textInput || !keyInput || !qrcodeDiv) {
            console.error("Elemente esențiale lipsă:", {
                textInput: !!textInput,
                keyInput: !!keyInput,
                qrcodeDiv: !!qrcodeDiv
            });
            alert("Unele elemente necesare lipsesc din pagină.");
            return;
        }
        
        // Obținem valorile din câmpuri și le curățăm de spații inutile
        const text = textInput.value.trim();
        const key = keyInput.value.trim();
        
        // Validăm intrările
        if (!text) {
            alert("Vă rugăm introduceți un mesaj de criptat.");
            return;
        }
        
        if (!key) {
            alert("Vă rugăm introduceți o cheie pentru criptare.");
            return;
        }
        
        try {
            // Efectuăm criptarea combinată (AES + Triple DES)
            const encrypted = combinedEncrypt(text, key);
            console.log("Text criptat cu succes.");
            
            // Generăm codul QR
            const canvas = document.createElement("canvas");
            QRCode.toCanvas(canvas, encrypted, function(error) {
                if (error) {
                    console.error("Eroare generare QR:", error);
                    alert("Eroare la generarea codului QR: " + error);
                    return;
                }
                
                // Afișăm codul QR
                qrcodeDiv.innerHTML = "";
                qrcodeDiv.appendChild(canvas);
                
                // Verificăm existența sau creăm link-ul de descărcare
                let downloadLink = document.getElementById("downloadLink");
                if (!downloadLink) {
                    console.log("Linkul de descărcare nu există. Îl creez acum...");
                    downloadLink = document.createElement("a");
                    downloadLink.id = "downloadLink";
                    downloadLink.className = "btn btn-success mt-2";
                    downloadLink.textContent = "Descarcă QR";
                    downloadLink.setAttribute("download", "qr_aes_tripledes.png");
                    // Adăugăm linkul după elementul qrcode
                    qrcodeDiv.parentNode.insertBefore(downloadLink, qrcodeDiv.nextSibling);
                } else {
                    // Dacă linkul există, îl facem vizibil
                    downloadLink.classList.remove("d-none");
                }
                
                // Actualizăm link-ul de descărcare
                downloadLink.href = canvas.toDataURL("image/png");
                
                console.log("Cod QR generat și afișat cu succes.");
            });
        } catch (error) {
            console.error("Eroare în procesul de criptare:", error);
            alert("Eroare la criptare: " + error.message);
        }
    });
    
    // Configurăm butonul de decriptare - compatibil cu ambele stiluri (ID sau onclick)
    const decryptButton = document.getElementById("decryptButton");
    const decryptButtonByOnclick = document.querySelector("button[onclick='handleDecrypt()']");
    
    if (decryptButton) {
        // Dacă butonul are ID, îi atașăm un event listener
        decryptButton.addEventListener("click", handleDecrypt);
        console.log("Butonul de decriptare (cu ID) configurat cu succes.");
    } else if (decryptButtonByOnclick) {
        // Dacă butonul are onclick, înlocuim cu event listener
        decryptButtonByOnclick.removeAttribute("onclick");
        decryptButtonByOnclick.addEventListener("click", handleDecrypt);
        console.log("Butonul de decriptare (cu onclick) configurat cu succes.");
    } else {
        console.error("EROARE: Butonul de decriptare nu a fost găsit!");
    }
});

/**
 * Funcția pentru gestionarea decriptării
 * Este definită global pentru a fi accesibilă și prin atributul onclick
 */
function handleDecrypt() {
    console.log("Inițiez procesul de decriptare...");
    
    // Verificăm existența elementelor necesare
    const fileInput = document.getElementById("qrInput");
    const keyInput = document.getElementById("keyDecrypt");
    const outputElement = document.getElementById("decryptedMessage");
    
    if (!fileInput || !keyInput || !outputElement) {
        console.error("Elemente lipsă pentru decriptare:", {
            fileInput: !!fileInput,
            keyInput: !!keyInput,
            outputElement: !!outputElement
        });
        alert("Unele elemente necesare pentru decriptare lipsesc din pagină.");
        return;
    }
    
    // Verificăm dacă avem fișier și cheie
    if (fileInput.files.length === 0) {
        alert("Vă rugăm încărcați o imagine QR pentru decriptare.");
        return;
    }
    
    const key = keyInput.value.trim();
    if (!key) {
        alert("Vă rugăm introduceți cheia pentru decriptare.");
        return;
    }
    
    const file = fileInput.files[0];
    const reader = new FileReader();
    
    // Configurăm handler pentru încărcarea fișierului
    reader.onload = function(e) {
        console.log("Imagine încărcată. Procesez codul QR...");
        const img = new Image();
        
        // Configurăm handler pentru încărcarea imaginii
        img.onload = function() {
            try {
                // Creăm un canvas pentru a putea accesa datele pixelilor
                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0);
                
                // Extragem datele și decodăm QR-ul
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imageData.data, canvas.width, canvas.height);
                
                if (code) {
                    console.log("Cod QR detectat. Încerc decriptarea...");
                    // Decriptăm conținutul QR-ului
                    const decrypted = combinedDecrypt(code.data, key);
                    outputElement.textContent = decrypted;
                    console.log("Decriptare finalizată cu succes.");
                } else {
                    console.error("Nu s-a putut detecta un cod QR valid în imagine.");
                    outputElement.textContent = "Cod QR invalid sau imposibil de detectat.";
                }
            } catch (error) {
                console.error("Eroare la procesarea imaginii:", error);
                outputElement.textContent = "Eroare la procesarea imaginii: " + error.message;
            }
        };
        
        // Handler pentru erori la încărcarea imaginii
        img.onerror = function() {
            console.error("Eroare la încărcarea imaginii");
            outputElement.textContent = "Eroare la încărcarea imaginii.";
        };
        
        // Setăm sursa imaginii pentru a începe încărcarea
        img.src = e.target.result;
    };
    
    // Handler pentru erori la citirea fișierului
    reader.onerror = function() {
        console.error("Eroare la citirea fișierului");
        outputElement.textContent = "Eroare la citirea fișierului.";
    };
    
    // Începem citirea fișierului
    reader.readAsDataURL(file);
}

/**
 * Implementarea funcțiilor de criptare și decriptare AES
 */
function aesEncrypt(text, key) {
    return CryptoJS.AES.encrypt(text, key).toString();
}

function aesDecrypt(ciphertext, key) {
    try {
        const bytes = CryptoJS.AES.decrypt(ciphertext, key);
        const plaintext = bytes.toString(CryptoJS.enc.Utf8);
        if (!plaintext) {
            throw new Error("Decriptare AES eșuată");
        }
        return plaintext;
    } catch (e) {
        console.error("Eroare decriptare AES:", e);
        throw new Error("Eroare la decriptare AES");
    }
}

/**
 * Implementarea funcțiilor de criptare și decriptare Triple DES
 */
function tripleDesEncrypt(text, key) {
    return CryptoJS.TripleDES.encrypt(text, key).toString();
}

function tripleDesDecrypt(ciphertext, key) {
    try {
        const bytes = CryptoJS.TripleDES.decrypt(ciphertext, key);
        const plaintext = bytes.toString(CryptoJS.enc.Utf8);
        if (!plaintext) {
            throw new Error("Decriptare Triple DES eșuată");
        }
        return plaintext;
    } catch (e) {
        console.error("Eroare decriptare Triple DES:", e);
        throw new Error("Eroare la decriptare Triple DES");
    }
}

/**
 * Funcția de criptare combinată
 * Aplică mai întâi AES, apoi Triple DES asupra rezultatului
 */
function combinedEncrypt(text, key) {
    try {
        // Criptăm mai întâi cu AES
        const aesEncrypted = aesEncrypt(text, key);
        console.log("Prima etapă (AES) completată cu succes.");
        
        // Apoi cu Triple DES
        const tripleDesEncrypted = tripleDesEncrypt(aesEncrypted, key);
        console.log("A doua etapă (Triple DES) completată cu succes.");
        
        // Adăugăm prefixul pentru a indica metoda de criptare
        return "DUAL:" + tripleDesEncrypted;
    } catch (e) {
        console.error("Eroare la criptarea combinată:", e);
        throw new Error("Eroare la criptarea combinată: " + e.message);
    }
}

/**
 * Funcția de decriptare combinată
 * Aplică decriptările în ordine inversă: mai întâi Triple DES, apoi AES
 */
function combinedDecrypt(ciphertext, key) {
    try {
        let actualCiphertext = ciphertext;
        
        // Verificăm dacă avem prefixul nostru și îl eliminăm dacă există
        if (ciphertext.startsWith("DUAL:")) {
            actualCiphertext = ciphertext.substring(5);
            console.log("Prefix DUAL detectat. Aplic decriptare în două etape.");
        } else {
            console.log("Prefix DUAL lipsă. Încerc decriptarea directă.");
        }
        
        // Prima decriptare: Triple DES
        const tripleDesDecrypted = tripleDesDecrypt(actualCiphertext, key);
        console.log("Prima etapă de decriptare (Triple DES) completată cu succes.");
        
        // A doua decriptare: AES
        const aesDecrypted = aesDecrypt(tripleDesDecrypted, key);
        console.log("A doua etapă de decriptare (AES) completată cu succes.");
        
        return aesDecrypted;
    } catch (e) {
        console.error("Eroare la decriptarea combinată:", e);
        
        // Încercăm fallback la metode singulare (pentru compatibilitate)
        try {
            console.log("Încerc decriptare doar cu AES...");
            return aesDecrypt(ciphertext, key);
        } catch (innerError) {
            console.error("Eșec și la decriptarea simplă:", innerError);
            return "Eroare la decriptare: Cheie greșită sau format incompatibil.";
        }
    }
}
