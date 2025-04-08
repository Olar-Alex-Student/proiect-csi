// Funcții AES Encryption/Decryption (existente)
function aesEncrypt(text, key) {
  return CryptoJS.AES.encrypt(text, key).toString();
}

function aesDecrypt(ciphertext, key) {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, key);
    const plaintext = bytes.toString(CryptoJS.enc.Utf8);
    return plaintext ? plaintext : "Cheie greșită sau mesaj corupt.";
  } catch (e) {
    return "Eroare la decriptare.";
  }
}

// Funcții Triple DES Encryption/Decryption (nou adăugate)
function tripleDesEncrypt(text, key) {
  return CryptoJS.TripleDES.encrypt(text, key).toString();
}

function tripleDesDecrypt(ciphertext, key) {
  try {
    const bytes = CryptoJS.TripleDES.decrypt(ciphertext, key);
    const plaintext = bytes.toString(CryptoJS.enc.Utf8);
    return plaintext ? plaintext : "Cheie greșită sau mesaj corupt.";
  } catch (e) {
    return "Eroare la decriptare.";
  }
}

// Funcție pentru a cripta text în funcție de algoritmul selectat
function encryptText(text, key, algorithm) {
  switch(algorithm) {
    case 'aes':
      return aesEncrypt(text, key);
    case 'tripledes':
      return tripleDesEncrypt(text, key);
    default:
      return aesEncrypt(text, key); // Default la AES
  }
}

// Funcție pentru a decripta text în funcție de algoritmul selectat
function decryptText(ciphertext, key, algorithm) {
  switch(algorithm) {
    case 'aes':
      return aesDecrypt(ciphertext, key);
    case 'tripledes':
      return tripleDesDecrypt(ciphertext, key);
    default:
      return aesDecrypt(ciphertext, key); // Default la AES
  }
}

document.getElementById("encryptForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const text = document.getElementById("textToEncrypt").value;
  const key = document.getElementById("keyEncrypt").value;
  const algorithm = document.getElementById("encryptAlgorithm").value;
  
  const encrypted = encryptText(text, key, algorithm);
  
  const canvas = document.createElement("canvas");
  QRCode.toCanvas(canvas, encrypted, function (error) {
    if (error) console.error(error);
    document.getElementById("qrcode").innerHTML = "";
    document.getElementById("qrcode").appendChild(canvas);
    const link = document.getElementById("downloadLink");
    link.href = canvas.toDataURL("image/png");
    link.classList.remove("d-none");
    
    // Actualizează numele fișierului în funcție de algoritm
    const fileName = algorithm === 'aes' ? "qr_aes.png" : "qr_tripledes.png";
    link.setAttribute('download', fileName);
  });
});

function handleDecrypt() {
  const fileInput = document.getElementById("qrInput");
  const key = document.getElementById("keyDecrypt").value;
  const algorithm = document.getElementById("decryptAlgorithm").value;
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
        const decrypted = decryptText(code.data, key, algorithm);
        output.textContent = decrypted;
      } else {
        output.textContent = "Cod QR invalid.";
      }
    };
    img.src = reader.result;
  };
  
  reader.readAsDataURL(file);
}
