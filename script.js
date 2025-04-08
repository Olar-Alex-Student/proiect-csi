// Așteptăm ca DOM-ul să fie complet încărcat înainte de a atașa event listeners
document.addEventListener("DOMContentLoaded", function() {
    // Verificăm dacă elementele există înainte de a atașa event listeners
    const encryptForm = document.getElementById("encryptForm");
    
    if (encryptForm) {
        encryptForm.addEventListener("submit", function(e) {
            e.preventDefault();
            
            const textElement = document.getElementById("textToEncrypt");
            const keyElement = document.getElementById("keyEncrypt");
            
            if (!textElement || !keyElement) {
                alert("Eroare: Unele elemente de formular lipsesc din pagină.");
                console.error("Elemente lipsă:", {
                    textElement: !!textElement,
                    keyElement: !!keyElement
                });
                return;
            }
            
            const text = textElement.value;
            const key = keyElement.value;
            
            // Verificăm dacă avem text și cheie
            if (!text || !key) {
                alert("Vă rugăm completați atât mesajul cât și cheia.");
                return;
            }
            
            // Aplicăm criptarea combinată
            const encrypted = combinedEncrypt(text, key);
            
            const qrcodeElement = document.getElementById("qrcode");
            if (!qrcodeElement) {
                alert("Eroare: Elementul pentru afișarea codului QR lipsește.");
                return;
            }
            
            const canvas = document.createElement("canvas");
            QRCode.toCanvas(canvas, encrypted, function(error) {
                if (error) {
                    console.error("Eroare generare QR:", error);
                    alert("Eroare la generarea codului QR.");
                    return;
                }
                
                qrcodeElement.innerHTML = "";
                qrcodeElement.appendChild(canvas);
                
                const link = document.getElementById("downloadLink");
                if (link) {
                    link.href = canvas.toDataURL("image/png");
                    link.classList.remove("d-none");
                    link.setAttribute('download', "qr_aes_tripledes.png");
                }
            });
        });
    } else {
        console.error("Formularul de criptare nu a fost găsit în pagină!");
    }
    
    // Atașăm funcția de decriptare la buton doar dacă butonul există
    const decryptButton = document.querySelector("button[onclick='handleDecrypt()']");
    if (decryptButton) {
        // Înlocuim atributul onclick cu un event listener proper
        decryptButton.removeAttribute("onclick");
        decryptButton.addEventListener("click", handleDecrypt);
    }
});

// Funcții AES
function aesEncrypt(text, key) {
    return CryptoJS.AES.encrypt(text, key).toString();
}

function aesDecrypt(ciphertext, key) {
    try {
        const bytes = CryptoJS.AES.decrypt(ciphertext, key);
        const plaintext = bytes.toString(CryptoJS.enc.Utf8);
        if (!plaintext)
            throw new Error("Decriptare AES eșuată");
        return plaintext;
    } catch (e) {
        console.error("Eroare decriptare AES:", e);
        throw new Error("Eroare la decriptare AES.");
    }
}

// Funcții Triple DES
function tripleDesEncrypt(text, key) {
    return CryptoJS.TripleDES.encrypt(text, key).toString();
}

function tripleDesDecrypt(ciphertext, key) {
    try {
        const bytes = CryptoJS.TripleDES.decrypt(ciphertext, key);
        const plaintext = bytes.toString(CryptoJS.enc.Utf8);
        if (!plaintext)
            throw new Error("Decriptare 3DES eșuată");
        return plaintext;
    } catch (e) {
        console.error("Eroare decriptare 3DES:", e);
        throw new Error("Eroare la decriptare Triple DES.");
    }
}

// Funcția de criptare combinată
function combinedEncrypt(text, key) {
    try {
        // Prima criptare: AES
        const aesResult = aesEncrypt(text, key);
        
        // A doua criptare: Triple DES
        const result = tripleDesEncrypt(aesResult, key);
        
        // Adăugăm un prefix pentru a marca faptul că acest text folosește criptare dublă
        return "DUAL:" + result;
    } catch (e) {
        console.error("Eroare la criptare combinată:", e);
        return "Eroare: " + e.message;
    }
}

// Funcția de decriptare combinată
function combinedDecrypt(ciphertext, key) {
    try {
        // Verificăm dacă începe cu prefixul nostru
        if (ciphertext.startsWith("DUAL:")) {
            // Eliminăm prefixul
            const actualCiphertext = ciphertext.substring(5);
            
            // Prima decriptare: Triple DES
            const tripleDesResult = tripleDesDecrypt(actualCiphertext, key);
            
            // A doua decriptare: AES
            return aesDecrypt(tripleDesResult, key);
        } 
        else {
            // Pentru compatibilitate cu versiuni anterioare
            try {
                // Încercăm mai întâi Triple DES, apoi AES
                const tripleDesResult = tripleDesDecrypt(ciphertext, key);
                return aesDecrypt(tripleDesResult, key);
            } catch (innerError) {
                // Încercăm doar AES (pentru compatibilitate cu QR-uri vechi)
                try {
                    return aesDecrypt(ciphertext, key);
                } catch (aesError) {
                    throw new Error("Cod QR incompatibil sau cheie greșită.");
                }
            }
        }
    } catch (e) {
        console.error("Eroare la decriptare combinată:", e);
        return "Eroare la decriptare: " + e.message;
    }
}

// Funcția de decriptare refolosită de buton
function handleDecrypt() {
    const fileInput = document.getElementById("qrInput");
    const keyElement = document.getElementById("keyDecrypt");
    const outputElement = document.getElementById("decryptedMessage");
    
    // Verificăm dacă toate elementele necesare există
    if (!fileInput || !keyElement || !outputElement) {
        alert("Eroare: Unele elemente necesare pentru decriptare lipsesc din pagină.");
        return;
    }
    
    const key = keyElement.value;
    
    if (fileInput.files.length === 0 || key === "") {
        alert("Încarcă o imagine și introdu cheia!");
        return;
    }
    
    const file = fileInput.files[0];
    const reader = new FileReader();
    
    reader.onload = function() {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            
            try {
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imageData.data, canvas.width, canvas.height);
                
                if (code) {
                    // Aplicăm decriptarea combinată
                    const decrypted = combinedDecrypt(code.data, key);
                    outputElement.textContent = decrypted;
                } else {
                    outputElement.textContent = "Cod QR invalid.";
                }
            } catch (error) {
                console.error("Eroare la procesarea imaginii:", error);
                outputElement.textContent = "Eroare la procesarea imaginii: " + error.message;
            }
        };
        
        img.onerror = function() {
            outputElement.textContent = "Eroare la încărcarea imaginii.";
        };
        
        img.src = reader.result;
    };
    
    reader.onerror = function() {
        outputElement.textContent = "Eroare la citirea fișierului.";
    };
    
    reader.readAsDataURL(file);
}
