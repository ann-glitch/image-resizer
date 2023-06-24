const form = document.querySelector("#img-form");
const img = document.querySelector("#img");
const outputPath = document.querySelector("#output-path");
const filename = document.querySelector("#filename");
const heightInput = document.querySelector("#height");
const widthInput = document.querySelector("#width");

// load image
function loadImage(e) {
  const file = e.target.files[0];

  // check if file is an image
  if (!isFileImage(file)) {
    alertMessage("Please select an image.", "red", "white", "center");
    return;
  }

  // get image original dimension
  const image = new Image();
  image.src = URL.createObjectURL(file);
  image.onload = function () {
    (widthInput.value = this.width), (heightInput.value = this.height);
  };

  // show html form, image name and output path
  form.style.display = "block";
  filename.innerText = file.name;
  outputPath.innerText = path.join(os.homedir(), "imageresizer");
}

// submit image for resizing
function submitImage(e) {
  e.preventDefault();
  console.log("submit");

  const width = widthInput.value;
  const height = heightInput.value;
  const imgPath = img.files[0].path;

  // check if there any images uploaded
  if (!img.files[0]) {
    alertMessage("Please upload an image.", "red", "white", "center");
    return;
  }

  // make sure width and height are added
  if (width === "" && height === "") {
    alertMessage("Please add a height and width.", "red", "white", "center");
    return;
  }

  // send to main using ipcRenderer
  ipcRenderer.send("image:resize", {
    width,
    height,
    imgPath,
  });
}

// catch image:done event
ipcRenderer.on("image:done", () => {
  alertMessage(
    `Image resized to ${widthInput.value} x ${heightInput.value}`,
    "green",
    "white",
    "center"
  );
});

// make sure file is an image
function isFileImage(file) {
  const acceptedImageTypes = ["image/jpeg", "image/png", "image/gif"];

  return file && acceptedImageTypes.includes(file["type"]);
}

// show alert messages.
function alertMessage(message, background, color, textAlign) {
  Toastify.toast({
    text: message,
    duration: 5000,
    close: false,
    style: {
      background,
      color,
      textAlign,
    },
  });
}

// upload image
img.addEventListener("change", loadImage);

// submit form
form.addEventListener("submit", submitImage);
