import React, { useEffect } from "react";
import * as openpgp from "openpgp";
import { PrivateKey } from "openpgp";
import { Buffer } from "buffer";

interface DecryptProps {
    privateKeys: PrivateKey[];
}

const DecryptTab = (props: DecryptProps) => {
    const [encryptedString, setEncryptedString] = React.useState<string | null>(null);
    const [decryptedString, setDecryptedString] = React.useState<string | null>(null);
    const [selectedPrivateKey, setSelectedPrivateKey] = React.useState<PrivateKey[]>([]);
    const [decryptionFailed, setDecryptionFailed] = React.useState<boolean>(false);

    useEffect(() => {
        if (selectedPrivateKey.length > 0 && encryptedString) {
            decrypt(encryptedString, selectedPrivateKey);
        } else {
            setDecryptedString(null);
        }
    }, [selectedPrivateKey, encryptedString]);

    const decrypt = async (encryptedString: string, privateKey: PrivateKey[]) => {
        try {
            setDecryptionFailed(false);
            const encryptedBuffer = Buffer.from(encryptedString, 'base64');
            const decrypted = await openpgp.decrypt({
                message: await openpgp.readMessage({ binaryMessage: encryptedBuffer }),
                decryptionKeys: privateKey,
            });
            setDecryptedString(decrypted.data);
        } catch (err) {
            setDecryptedString(null);
            setDecryptionFailed(true);
            console.error(err);
        }
    }

    return (
        <>
            {props.privateKeys.length === 0 && (
                // make an overlay of the page that says "You have no public keys. Please create one."
                <div style={{
                    position: "absolute",
                    top: 46,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                    backdropFilter: "blur(5px)",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                }}>
                    <div style={{
                        backgroundColor: "white",
                        padding: "20px",
                        borderRadius: "10px",
                        margin: "20px",
                    }}>
                        <h2>You have no private keys yet, please create or import one in order to decrypt.</h2>
                    </div>
                </div>
            )}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
            }}>
                <h2>Decrypt a message</h2>
                <label>Choose the private key(s) to decrypt with:</label>
                <select
                    style={{
                        marginBottom: '10px',
                    }}
                    onChange={async (e) => {
                        const selected = e.target.selectedOptions;
                        const selectedKeys = [];
                        for (let i = 0; i < selected.length; i++) {
                            selectedKeys.push(selected[i].value);
                        }

                        const keys = []

                        // read each selected key and add to the state
                        for (const key of selectedKeys) {
                            const keyObj = await openpgp.readPrivateKey({ armoredKey: key });
                            keys.push(keyObj);
                        }

                        setSelectedPrivateKey(keys);
                    }}
                    multiple={true}
                >
                    {props.privateKeys.map((key, index) => {
                        return <option key={index} value={key.armor()}>{key.getUserIDs()}</option>
                    })}
                </select>
                <label>Encrypted message:</label>
                <textarea
                    style={{
                        marginBottom: '10px',
                        height: '100px',
                    }}
                    onChange={(e) => {
                        setEncryptedString(e.target.value);
                    }}
                />

                <label>Decrypted message:</label>
                <textarea
                    readOnly
                    style={{
                        marginBottom: '10px',
                        border: decryptionFailed ? '1px solid red' : '1px solid black',
                        height: '100px',
                    }}
                    value={decryptedString || ''}
                />
            </div>
        </>
    );
}

export default DecryptTab;