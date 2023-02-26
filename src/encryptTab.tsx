import * as openpgp from "openpgp";
import { PublicKey } from "openpgp";
import React, { useEffect } from "react";
import { Buffer } from "buffer";

interface EncryptProps {
    publicKeys: PublicKey[];
}

const EncryptTab = (props: EncryptProps) => {
    const [selectedPublicKeys, setSelectedPublicKeys] = React.useState<PublicKey[]>([]);
    const [encryptedText, setEncryptedText] = React.useState<string | null>(null);
    const [plainText, setPlainText] = React.useState<string | null>(null);
    const [copied, setCopied] = React.useState<boolean>(false);

    const encrypt = async (plainText: string, publicKeys: PublicKey[]) => {
        try {
            const message = await openpgp.createMessage({ text: plainText });
            const encryptedText = await openpgp.encrypt({
                message,
                encryptionKeys: publicKeys,
                format: 'binary'
            });
            setEncryptedText(Buffer.from(encryptedText).toString('base64'));
            setCopied(false);
        } catch (err) {
            console.error(err);
        }
    }

    useEffect(() => {
        if (selectedPublicKeys.length > 0 && plainText) {
            encrypt(plainText, selectedPublicKeys);
        } else {
            setEncryptedText(null);
        }
    }, [selectedPublicKeys, plainText]);

    return (
        <>
            {props.publicKeys.length === 0 && (
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
                        <h2>You have no public keys yet, please create or import one in order to encrypt.</h2>
                    </div>
                </div>
            )}
            <div style={{
                display: "flex",
                flexDirection: "column",
            }}>
                <h2>Encrypt a message</h2>
                <label>Choose the intended recipient(s):</label>
                <select
                    style={{
                        marginBottom: "10px",
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
                            const readKey = await openpgp.readKey({ armoredKey: key });
                            keys.push(readKey as PublicKey);
                        }

                        setSelectedPublicKeys(keys);
                    }}
                    multiple>
                    {props.publicKeys.map((key, index) => {
                        return (
                            <option value={key.armor()} key={index}>{key.getUserIDs()}</option>
                        );
                    })}
                </select>

                <label>Enter the text you want to encrypt in the box below:</label>
                <textarea onChange={(e) => {
                    setPlainText(e.target.value);
                }} style={{
                    width: "100%",
                    height: "100px",
                    marginBottom: "10px",
                }} id="plainText" />
                <label>The following will be able to be decrypted by&nbsp;
                    {/* list all the keys that can decrypt it */}
                    {selectedPublicKeys.map((key, index) => {
                        return (
                            <div key={index}>
                                <span style={{
                                    fontWeight: "bold",
                                }}>{key.getUserIDs()}</span>
                                {index < selectedPublicKeys.length - 1 ? ", " : "."}
                            </div>
                        );
                    })}
                </label>
                <textarea readOnly style={{
                    width: "100%",
                    height: "100px",

                }} id="encryptedText" value={encryptedText || ''} />
                <button style={{
                    marginTop: "10px",
                }} onClick={() => {
                    navigator.clipboard.writeText(encryptedText || '').then(() => {
                        setCopied(true);
                    })
                }}>{copied ? "Copied!" : "Copy to clipboard"}
                </button>
            </div>
        </>
    );
}

export default EncryptTab;
