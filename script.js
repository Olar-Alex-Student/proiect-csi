// Funcții AES îmbunătățite
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

// Funcții Triple DES îmbunătățite
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

// Funcția de criptare combinată, îmbunătățită
function combinedEncrypt(text, key) {
  try {
    // Prima criptare: AES
    const aesResult = aesEncrypt(text, key);
    
    // A doua criptare: Triple DES
    // Adăugăm un marcator pentru a identifica metoda de criptare
    const result = tripleDesEncrypt(aesResult, key);
    
    // Adăugăm un prefix pentru a marca faptul că acest text folosește criptare dublă
    return "DUAL:" + result;
  } catch (e) {
    console.error("Eroare la criptare combinată:", e);
    return "Eroare: " + e.message;
  }
}

// Funcția de decriptare combinată, îmbunătățită
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
      // Pentru compatibilitate cu versiuni anterioare,
      // încercăm să decriptăm direct cu ambele metode
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

document.getElementById("encryptForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const text = document.getElementById("textToEncrypt").value;
  const key = document.getElementById("keyEncrypt").value;
  
  // Aplicăm criptarea combinată
  const encrypted = combinedEncrypt(text, key);
  
  // Verificăm dacă criptarea a reușit
  if (encrypted.startsWith("Eroare:")) {
    alert(encrypted);
    return;
  }
  
  const canvas = document.createElement("canvas");
  QRCode.toCanvas(canvas, encrypted, function (error) {
    if (error) console.error(error);
    document.getElementById("qrcode").innerHTML = "";
    document.getElementById("qrcode").appendChild(canvas);
    const link = document.getElementById("downloadLink");
    link.href = canvas.toDataURL("image/png");
    link.classList.remove("d-none");
    link.setAttribute('download', "qr_aes_tripledes.png");
  });
});

function handleDecrypt() {
  const fileInput = document.getElementById("qrInput");
  const key = document.getElementById("keyDecrypt").value;
  const output = document.getElementById("decryptedMessage");
  
  if (fileInput.files.length === 0 || key === "") {
    alert("Încarcă o imagine și introdu cheia!");
    return;
  }
  
  const file = fileInput.files[0];
  const reader = new FileReader();
  
  reader.onload = function () {
    const img = new Image();
    img.onload = function () {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, canvas.width, canvas.height);
      
      if (code) {
        // Aplicăm decriptarea combinată
        const decrypted = combinedDecrypt(code.data, key);
        output.textContent = decrypted;
      } else {
        output.textContent = "Cod QR invalid.";
      }
    };
    img.src = reader.result;
  };
  
  reader.readAsDataURL(file);
}
