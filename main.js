const path = require("path");
const os = require("os");
const fs = require("fs");
const resizeImg = require("resize-img");
const { app, BrowserWindow, Menu, ipcMain, shell } = require("electron");

const isDev = process.env.NODE_ENV !== "production";
const isMac = process.platform === "darwin";

let mainWindow;
let aboutWindow;

// create the main window
function createMainWindow() {
  mainWindow = new BrowserWindow({
    title: "Image Resizer",
    width: isDev ? 1200 : 500,
    height: 550,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // show devtools when in development mode
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // mainWindow.loadURL(`file://${__dirname}/renderer/index.html`);
  mainWindow.loadFile(path.join(__dirname, "./renderer/index.html"));
}

// create the about window
function createAboutWindow() {
  aboutWindow = new BrowserWindow({
    title: "About Image Resizer",
    width: 400,
    height: 400,
  });

  // mainWindow.loadURL(`file://${__dirname}/renderer/about.html`);
  aboutWindow.loadFile(path.join(__dirname, "./renderer/about.html"));
}

// app is ready
app.whenReady().then(() => {
  createMainWindow();

  // implement menu template
  const mainMenu = Menu.buildFromTemplate(menu);
  Menu.setApplicationMenu(mainMenu);

  // remoove mainWindow from memory on close
  mainWindow.on("closed", () => (mainWindow = null));

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

// menu template
const menu = [
  ...(isMac
    ? [
        {
          label: app.name,
          submenu: [
            {
              label: "About",
              click: createAboutWindow,
            },
          ],
        },
      ]
    : []),
  {
    role: "fileMenu",
  },
  ...(!isMac
    ? [
        {
          label: "Help",
          submenu: [
            {
              label: "About",
              click: createAboutWindow,
            },
          ],
        },
      ]
    : []),
];

// respond to ipcRenderer image resize
ipcMain.on("image:resize", (e, options) => {
  options.dest = path.join(os.homedir(), "imageresizer");
  resizeImage(options);
});

// resize image and download
async function resizeImage({ imgPath, width, height, dest }) {
  try {
    const newPath = await resizeImg(fs.readFileSync(imgPath), {
      width: +width,
      height: +height,
    });

    // create filename. (Decided to use the default name of the file uploaded)
    const filename = path.basename(imgPath);

    // create dest folder if it doesn't exist
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest);
    }

    // write file to dest folder
    fs.writeFileSync(path.join(dest, filename), newPath);

    // send success message
    mainWindow.webContents.send("image:done");

    // open dest folder
    shell.openPath(dest);
  } catch (err) {
    console.log(err);
  }
}

app.on("window-all-closed", () => {
  if (!isMac) {
    app.quit();
  }
});
