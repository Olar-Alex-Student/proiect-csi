// Așteptăm încărcarea completă a paginii înainte de a executa orice cod
document.addEventListener("DOMContentLoaded", function() {
    console.log("DOM încărcat complet. Inițializez aplicația...");
    
    // Verificăm existența formularului de criptare
    const encryptForm = document.getElementById("encryptForm");
    if (!encryptForm) {
        console.error("EROARE CRITICĂ: Formularul #encryptForm nu există în pagină!");
        alert("Eroare la inițializarea aplicației. Verificați consola pentru detalii.");
        return;
    }
    
    // Adăugăm handler pentru submisia formularului
    encryptForm.addEventListener("submit", function(e) {
        e.preventDefault();
        console.log("Formular trimis. Inițiez procesul de criptare...");
        
        // Obținem elementele necesare cu verificări
        const textInput = document.getElementById("textToEncrypt");
        const keyInput = document.getElementById("keyEncrypt");
        const qrcodeDiv = document.getElementById("qrcode");
        const downloadLink = document.getElementById("downloadLink");
        
        // Verificăm dacă toate elementele necesare există
        if (!textInput || !keyInput || !qrcodeDiv || !downloadLink) {
            console.error("Elemente lipsă:", {
                textInput: !!textInput,
                keyInput: !!keyInput,
                qrcodeDiv: !!qrcodeDiv,
                downloadLink: !!downloadLink
            });
            alert("Unele elemente necesare lipsesc din pagină. Verificați consola pentru detalii.");
            return;
        }
        
        // Obținem valorile din câmpuri
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
            // Efectuăm criptarea
            const encrypted = combinedEncrypt(text, key);
            console.log("Text criptat cu succes.");
            
            // Generăm codul QR
            QRCode.toCanvas(document.createElement("canvas"), encrypted, function(error, canvas) {
                if (error) {
                    console.error("Eroare generare QR:", error);
                    alert("Eroare la generarea codului QR: " + error);
                    return;
                }
                
                // Afișăm codul QR
                qrcodeDiv.innerHTML = "";
                qrcodeDiv.appendChild(canvas);
                
                // Actualizăm link-ul de descărcare
                downloadLink.href = canvas.toDataURL("image/png");
                downloadLink.classList.remove("d-none");
                downloadLink.setAttribute('download', "qr_aes_tripledes.png");
                
                console.log("Cod QR generat și afișat cu succes.");
            });
        } catch (error) {
            console.error("Eroare în procesul de criptare:", error);
            alert("Eroare la criptare: " + error.message);
        }
    });
    
    // Configurăm funcția de decriptare
    const decryptButton = document.querySelector("button[onclick='handleDecrypt()']");
    if (decryptButton) {
        // Înlocuim atributul inline cu un event listener proper
        decryptButton.removeAttribute("onclick");
        decryptButton.addEventListener("click", handleDecrypt);
        console.log("Butonul de decriptare configurat cu succes.");
    } else {
        console.error("EROARE: Butonul de decriptare nu a fost găsit!");
    }
});

// Funcția de decriptare
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

// Implementarea algoritmilor de criptare

// AES
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

// Triple DES
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

// Funcții combinate
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
