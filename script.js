// Funcții individuale pentru AES
function aesEncrypt(text, key) {
  return CryptoJS.AES.encrypt(text, key).toString();
}

function aesDecrypt(ciphertext, key) {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, key);
    const plaintext = bytes.toString(CryptoJS.enc.Utf8);
    return plaintext ? plaintext : "Cheie greșită sau mesaj corupt.";
  } catch (e) {
    return "Eroare la decriptare AES.";
  }
}

// Funcții individuale pentru Triple DES
function tripleDesEncrypt(text, key) {
  return CryptoJS.TripleDES.encrypt(text, key).toString();
}

function tripleDesDecrypt(ciphertext, key) {
  try {
    const bytes = CryptoJS.TripleDES.decrypt(ciphertext, key);
    const plaintext = bytes.toString(CryptoJS.enc.Utf8);
    return plaintext ? plaintext : "Cheie greșită sau mesaj corupt.";
  } catch (e) {
    return "Eroare la decriptare Triple DES.";
  }
}

// Funcție de criptare combinată: AES + Triple DES
function combinedEncrypt(text, key) {
  // Prima criptare folosind AES
  const aesEncrypted = aesEncrypt(text, key);
  // A doua criptare folosind Triple DES asupra rezultatului AES
  const tripleDesEncrypted = tripleDesEncrypt(aesEncrypted, key);
  return tripleDesEncrypted;
}

// Funcție de decriptare combinată: Triple DES + AES (în ordine inversă)
function combinedDecrypt(ciphertext, key) {
  // Prima decriptare folosind Triple DES
  const tripleDesDecrypted = tripleDesDecrypt(ciphertext, key);
  
  // Verificăm dacă prima decriptare a reușit
  if (tripleDesDecrypted.includes("Eroare") || tripleDesDecrypted.includes("Cheie greșită")) {
    return tripleDesDecrypted;
  }
  
  // A doua decriptare folosind AES
  const aesDecrypted = aesDecrypt(tripleDesDecrypted, key);
  return aesDecrypted;
}

document.getElementById("encryptForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const text = document.getElementById("textToEncrypt").value;
  const key = document.getElementById("keyEncrypt").value;
  
  // Aplicăm criptarea combinată
  const encrypted = combinedEncrypt(text, key);
  
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
