import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import * as openpgp from "openpgp";
import { PublicKey, PrivateKey } from "openpgp";
import TopNav, { pages } from "./topNav";
import KeyTab from "./keyTab";
import EncryptTab from "./encryptTab";
import DecryptTab from "./decryptTab";

const Popup = () => {
  // store a hashmap of public keys in state with the keyname as its key
  const [publicKeys, setPublicKeys] = useState<PublicKey[]>([]);
  const [privateKeys, setPrivateKeys] = useState<PrivateKey[]>([]);

  useEffect(() => {
    // load the keys from chrome storage
    chrome.storage.sync.get(null, function (items) {
      (async () => {
        const keys = Object.keys(items);
        const publicKeys: PublicKey[] = [];
        const privateKeys: PrivateKey[] = [];
        for (const key of keys) {
          const keyPair = JSON.parse(items[key]);
          // if a public key is found, add it to the publicKeys object
          if (keyPair.publicKey) {
            publicKeys.push(await openpgp.readKey({
              armoredKey: keyPair.publicKey
            }));
          }
          // if a private key is found, add it to the privateKeys object
          if (keyPair.privateKey) {
            privateKeys.push(await openpgp.readPrivateKey({
              armoredKey: keyPair.privateKey
            }));
          }
        };
        setPublicKeys(publicKeys);
        setPrivateKeys(privateKeys);
      })();
    });
  }, []);

  const [selectedTab, setSelectedTab] = useState<string>(pages.Keys);
  return (
    <div style={{
      minWidth: '400px',
    }}>
      <TopNav onChange={setSelectedTab} />
      {selectedTab === pages.Encrypt && (
        <div>
          <EncryptTab publicKeys={publicKeys} />
        </div>
      )}
      {selectedTab === pages.Decrypt && (
        <DecryptTab privateKeys={privateKeys} />
      )}
      {selectedTab === pages.Keys && (
        <div>
          <KeyTab
            onImport={(key) => {
              // if it's a public key, add it to the publicKeys object
              if (key.indexOf('-----BEGIN PGP PUBLIC KEY BLOCK-----') !== -1) {
                openpgp.readKey({
                  armoredKey: key
                }).then((key) => {
                  // if key by this name exists, ignore it
                  if (publicKeys.find((k) => k.getUserIDs()[0] === key.getUserIDs()[0])) {
                    alert('Key with this name already exists, ignoring');
                    return;
                  }

                  const keyName = key.getUserIDs()[0];
                  chrome.storage.sync.get(keyName, function (items) {
                    const keyPair = JSON.parse(items[keyName]);
                    keyPair.publicKey = key.armor();
                    chrome.storage.sync.set({ [keyName]: JSON.stringify(keyPair) });
                    // add to state
                    setPublicKeys([...publicKeys, key]);
                  });
                });
              } else {
                // if it's a private key, add it to the privateKeys object
                openpgp.readPrivateKey({
                  armoredKey: key
                }).then((key) => {
                  // if key by this name exists, ignore it
                  if (privateKeys.find((k) => k.getUserIDs()[0] === key.getUserIDs()[0])) {
                    alert('Key with this name already exists, ignoring');
                    return;
                  }
                  const keyName = key.getUserIDs()[0];
                  chrome.storage.sync.get(keyName, function (items) {
                    const keyPair = JSON.parse(items[keyName]);
                    keyPair.privateKey = key.armor();
                    chrome.storage.sync.set({ [keyName]: JSON.stringify(keyPair) });
                    // add to state
                    setPrivateKeys([...privateKeys, key]);
                  });

                  // get the public key out and add it if it's not already there
                  const publicKey = key.toPublic();
                  if (!publicKeys.find((k) => k.getUserIDs()[0] === publicKey.getUserIDs()[0])) {
                    const keyName = publicKey.getUserIDs()[0];
                    chrome.storage.sync.get(keyName, function (items) {
                      const keyPair = JSON.parse(items[keyName]);
                      keyPair.publicKey = publicKey.armor();
                      chrome.storage.sync.set({ [keyName]: JSON.stringify(keyPair) });
                      // add to state
                      setPublicKeys([...publicKeys, publicKey]);
                    });
                  }
                });
              }
            }}
            onDelete={(key: PublicKey | PrivateKey) => {
              const keyName = key.getUserIDs()[0];
              if (key instanceof PrivateKey) {
                chrome.storage.sync.get(keyName, function (items) {
                  const keyPair = JSON.parse(items[keyName]);
                  keyPair.privateKey = null;
                  chrome.storage.sync.set({ [keyName]: JSON.stringify(keyPair) });
                  // remove from state
                  setPrivateKeys(privateKeys.filter((key) => key.getUserIDs()[0] !== keyName));
                });
              } else {
                chrome.storage.sync.get(keyName, function (items) {
                  const keyPair = JSON.parse(items[keyName]);
                  keyPair.publicKey = null;
                  chrome.storage.sync.set({ [keyName]: JSON.stringify(keyPair) });
                  // remove from state
                  setPublicKeys(publicKeys.filter((key) => key.getUserIDs()[0] !== keyName));
                });
              }
            }}
            onGenerate={
              async (keyPair) => {
                // if key already exists, ignore
                if (publicKeys.find((key) => key.getUserIDs()[0] === keyPair.keyName) || privateKeys.find((key) => key.getUserIDs()[0] === keyPair.keyName)) {
                  alert('Key by this name already exists!');
                  return;
                }

                const publicKey = await openpgp.readKey({
                  armoredKey: keyPair.publicKey
                });
                const privateKey = await openpgp.readPrivateKey({
                  armoredKey: keyPair.privateKey
                });
                await chrome.storage.sync.set({ [keyPair.keyName]: JSON.stringify(keyPair) });
                // add the keys to state
                setPublicKeys([...publicKeys, publicKey]);
                setPrivateKeys([...privateKeys, privateKey]);
              }
            } publicKeys={publicKeys} privateKeys={privateKeys} />
        </div>
      )}

      <button
        title="Decrypt page content"
        onClick={() => {
          chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (!tabs[0] || !tabs[0].id) return;
            chrome.tabs.sendMessage(tabs[0].id, { subject: 'decrypt_page' }, function (response) {
              console.log(response);
            });
          });
        }}>
        {/* unlock emoji */}
        🔓
      </button>
    </div>
  );
};

ReactDOM.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>,
  document.getElementById("root")
);
