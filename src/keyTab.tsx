import React from "react";
import { PublicKey, PrivateKey } from "openpgp";
import * as openpgp from "openpgp";

interface KeyTabProps {
    publicKeys: PublicKey[];
    privateKeys: PrivateKey[];
    onGenerate: (keyPair: { publicKey: string, privateKey: string, keyName: string }) => void;
    onDelete: (key: PublicKey | PrivateKey) => void;
    onImport: (key: string) => void;
}

const exportKey = (key: PublicKey | PrivateKey) => {
    // copy the key to the clipboard
    navigator.clipboard.writeText(key.armor()).then(() => {
        if (key instanceof PrivateKey) {
            alert(`Private key copied to clipboard! DO NOT SHARE IT WITH ANYONE!\n\n${key.armor()}`);
        } else {
            alert(`Public key copied to clipboard! You can share this with anyone\n\n${key.armor()}`);
        }
    });
}

const KeyTab = (props: KeyTabProps) => {
    const [showImportTextArea, setShowImportTextArea] = React.useState(false);
    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
        }}>
            <div>
                <h2>Public Keys</h2>
                <label>Public Keys are used to encrypt content.
                    You can encrypt text using one or several public keys.
                    The data can only be read using the private key.
                    These can safely be shared with anyone and will allow them
                    to encrypt content for your eyes only.
                </label>
                <ul>
                    {props.publicKeys.map((key, index) => {
                        return (
                            <li style={{
                                width: "100%",
                                padding: "10px 0",
                                height: "1rem",
                                backgroundColor: index % 2 === 0 ? "#eee" : "#fff",
                            }} key={index}>
                                <label style={{
                                    verticalAlign: "middle",
                                }}>{key.getUserIDs()}</label>
                                <div style={{
                                    float: "right",
                                    display: "flex",
                                    flexDirection: "row",
                                    alignItems: "center",
                                }}>
                                    <button
                                        title="Export as string"
                                        onClick={() => {
                                            exportKey(key);
                                        }}
                                    >Export</button>

                                    {/* Trash can emoji */}
                                    <button style={{
                                        backgroundColor: "transparent",
                                        border: "none",
                                        cursor: "pointer",
                                    }} onClick={() => {
                                        // confirm delete with a prompt
                                        if (confirm(`Are you sure you want to delete the key "${key.getUserIDs()}"?`)) {
                                            props.onDelete(key);
                                        }
                                    }} title="Delete">
                                        ❌
                                    </button>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>
            <div>
                <h2>Private Keys</h2>
                <label>Private Keys are used to decrypt content. You should NOT share private keys with anyone else.
                    However, you may want to make secure backups of your private keys.
                </label>
                <ul>
                    {props.privateKeys.map((key, index) => {
                        return (
                            <li style={{
                                width: "100%",
                                padding: "10px 0",
                                height: "1rem",
                                backgroundColor: index % 2 === 0 ? "#eee" : "#fff",
                            }} key={index}>
                                <label style={{
                                    verticalAlign: "middle",
                                }}>{key.getUserIDs()}</label>
                                <div style={{
                                    float: "right",
                                    display: "flex",
                                    flexDirection: "row",
                                    alignItems: "center",
                                }}>
                                    <button
                                        title="Export as string"
                                        onClick={() => {
                                            exportKey(key);
                                        }}
                                    >Export</button>

                                    {/* Trash can emoji */}
                                    <button style={{
                                        backgroundColor: "transparent",
                                        border: "none",
                                        cursor: "pointer",
                                    }} onClick={() => {
                                        // confirm delete with a prompt
                                        if (confirm(`Are you sure you want to delete the key "${key.getUserIDs()}"?`)) {
                                            props.onDelete(key);
                                        }
                                    }} title="Delete">
                                        ❌
                                    </button>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>
            <hr />
            <button
                onClick={async () => {
                    // prompt user to enter name for key
                    const keyName = prompt("Enter a name for the key:");

                    if (!keyName) {
                        return;
                    }

                    const { privateKey, publicKey } = await openpgp.generateKey({
                        userIDs: [{ name: keyName }],
                        format: 'armored'
                    });

                    const keyPair = {
                        publicKey: publicKey,
                        privateKey: privateKey,
                        keyName: keyName,
                    }

                    props.onGenerate(keyPair);
                }}
            >
                Generate Key Pair
            </button>
            <button
                style={{
                    marginTop: "10px",
                }}
             onClick={() => {
                setShowImportTextArea(!showImportTextArea);
            }}>
                {showImportTextArea ? "Hide" : "Import Key"}
            </button>
            {showImportTextArea && (
                <>
                    <label>
                        Paste the key you want to import here:
                    </label>
                    <textarea id="import" style={{
                        width: "100%",
                        height: "200px",
                        resize: "none",
                    }} />
                    <button onClick={() => {
                        const key = (document.getElementById("import") as HTMLTextAreaElement).value;
                        props.onImport(key);
                    }}>
                        Import
                    </button>
                </>
            )}

        </div>
    );
};

export default KeyTab;