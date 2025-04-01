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

document.getElementById("encryptForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const text = document.getElementById("textToEncrypt").value;
  const key = document.getElementById("keyEncrypt").value;
  const encrypted = aesEncrypt(text, key);

  const canvas = document.createElement("canvas");
  QRCode.toCanvas(canvas, encrypted, function (error) {
    if (error) console.error(error);
    document.getElementById("qrcode").innerHTML = "";
    document.getElementById("qrcode").appendChild(canvas);

    const link = document.getElementById("downloadLink");
    link.href = canvas.toDataURL("image/png");
    link.classList.remove("d-none");
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
        const decrypted = aesDecrypt(code.data, key);
        output.textContent = decrypted;
      } else {
        output.textContent = "Cod QR invalid.";
      }
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}
