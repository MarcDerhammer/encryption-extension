import * as openpgp from 'openpgp';

import { Buffer } from 'buffer';
import { Key, PrivateKey } from 'openpgp';

const decryptAllPageContent = async () => {
  chrome.storage.sync.get(null, async function (items) {
    const keys = Object.keys(items);
    const publicKeys: { [key: string]: Key } = {};
    const privateKeys: { [key: string]: PrivateKey } = {};
    for (const key of keys) {
      const keyPair = JSON.parse(items[key]);
      // if a public key is found, add it to the publicKeys object
      if (keyPair.publicKey) {
        publicKeys[key] = await openpgp.readKey({
          armoredKey: keyPair.publicKey
        });
      }
      // if a private key is found, add it to the privateKeys object
      if (keyPair.privateKey) {
        privateKeys[key] = await openpgp.readPrivateKey({
          armoredKey: keyPair.privateKey
        });
      }
    }

    // look for any encrypted text in the document... it starts with "wV4D" and it goes to the end of that character or element value or space
    // we want to replace all this content with the decrypted value
    const encryptedText = document.body.innerHTML.match(/wV4D(.|\s)*?(?="|>|<|\n| )/g);

    let counter = 0;

    // if there is encrypted text, decrypt it
    if (encryptedText) {
      // for each encrypted text, decrypt it
      encryptedText.forEach(async (encrypted) => {
        // for each private key, try to decrypt the text
        Object.keys(privateKeys).forEach(async (keyName) => {
          const key = privateKeys[keyName];
          try {
            const decrypted = await openpgp.decrypt({
              message: await openpgp.readMessage({
                binaryMessage: Buffer.from(encrypted, 'base64')
              }),
              decryptionKeys: key
            });

            const decryptedElement = decrypted.data + `<span style="opacity: 0.5" title="decrypted with ${keyName} private key" style="opacity: 0.6">&nbsp;🔓</span>`;

            counter++;

            // replace the encrypted text with the decrypted text
            document.body.innerHTML = document.body.innerHTML.replace(encrypted, decryptedElement);
          } catch (err) {

          }
        });
      });
    }
    return counter;
  });
}

decryptAllPageContent();

// add a listener for when user clicks the "decrypt page" button in the popup
chrome.runtime.onMessage.addListener(
  async function (request, sender, sendResponse) {
    console.log(request);
    if (request.subject === "decrypt_page") {
      const count = await decryptAllPageContent();
      sendResponse({ message: "decrypted", count });
    }
  }
);
