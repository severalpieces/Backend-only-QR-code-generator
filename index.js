
import inquirer from "inquirer";
import qr from "qr-image";
import * as fsPromises from "node:fs/promises";
import * as fs from "node:fs";
import path from "node:path";

async function readIndex() {
  try {
    const data = await fsPromises.readFile("./index.txt", {
      encoding: "utf-8",
    });
    return parseInt(data, 10) || 1; //parseInt将data(string)解析为一个十进制的整数然后return，如果parseInt的结果是undefined, NaN, null等伪值的话return 1
  } catch (err) {
    console.error(
      "There is something wrong when trying to read the index:",
      err.message
    );
    return 1;
  }
}
let i = await readIndex();

async function writeIndex(index) {
  try {
    await fsPromises.writeFile("./index.txt", index.toString(), {
      encoding: "utf-8",
    });
  } catch (err) {
    console.error(
      "There is something wrong when trying to write the index:",
      err.message
    );
  }
}

async function checkAndClearStorage() {
  if (i > 3) {
    const directory = "./output/QR-codes";
    console.log("Oops! I need to clear your storage now.");
    try {
      const clearText = fsPromises.truncate(
        "./output/user_input_history.txt",
        0
      );
      const files = await fsPromises.readdir(directory);
      const deletePromises = files.map((fileName) =>
        fsPromises.unlink(path.join(directory, fileName))
      );
      deletePromises.push(clearText);
      await Promise.all(deletePromises);
      console.log("All the files have been successfully deleted");
      i = 1;
    } catch (error) {
      console.error(
        "There was an error when clearing up storage:",
        error.message
      );
    }
  }
}

function returnPromise(object) {
  return new Promise((resolve, reject) => {
    object.on("finish", resolve);
    object.on("error", reject);
  });
}

function generateQRImage(text) {
  const qrImage = qr.image(text, {
    type: "png",
    size: 10,
    margin: 1,
    parse_url: true,
  });
  const imageStream = fs.createWriteStream(`./output/QR-codes/image${i}.png`);
  qrImage.pipe(imageStream); //从qrImage这个可读流读入数据，写入可写流中);
  return returnPromise(imageStream);
}

async function generateQRImage1(text) {
  const qrImage = qr.image(text, {
    type: "png",
    size: 10,
    margin: 1,
    parse_url: true,
  });
  qrImage.pipe(fs.createWriteStream(`./output/QR-codes/image${i}.png`));
}

function saveInputText(text) {
  const writableStream = fs.createWriteStream(
    "./output/user_input_history.txt",
    { flags: "a" }
  );
  writableStream.write(`${i}: ${text}\n`);
  writableStream.end();
  return returnPromise(writableStream);
}

async function saveInputText1(text) {
  const writableStream = fs.createWriteStream(
    "./output/user_input_history.txt",
    { flags: "a" }
  );
  writableStream.write(`${i}: ${text}\n`);
  writableStream.end();
}

async function generateImageAndSaveInputTextPromonises(text) {
  await checkAndClearStorage();
  const generateImageAndSaveInputTextPromonises = [
    generateQRImage(text),
    saveInputText(text),
  ];
  await Promise.all(generateImageAndSaveInputTextPromonises);
  i++;
  writeIndex(i);
}

inquirer
  .prompt([
    /* Pass your questions in here */
    {
      type: "input",
      name: "userInput",
      message: "Enter a text or an URL:",
    },
  ])
  .then((answers) => {
    // Use user feedback for... whatever!!
    generateImageAndSaveInputTextPromonises(answers.userInput);
  })
  .catch((error) => {
    if (error.isTtyError) {
      console.log(" Prompt couldn't be rendered in the current environment");
    } else {
      console.log("Something else went wrong");
    }
  });
