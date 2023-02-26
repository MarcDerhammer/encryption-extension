import React from "react";

const navStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: "1rem",
    borderBottom: "1px solid #aaa",
}

export enum pages {
    Keys = "Keys",
    Encrypt = "Encrypt",
    Decrypt = "Decrypt",
}

const pageList = Object.keys(pages) as pages[];

interface TopNavProps {
    onChange: (page: pages) => void;
}

// bring down the styles
const TopNav = (props: TopNavProps) => {
    const [selected, setSelected] = React.useState<pages>(pages.Keys);

    React.useEffect(() => {
        props.onChange(selected);
    }, [selected]);

    const buttonStyle = {
        cursor: "pointer",
        border: "none",
        backgroundColor: "transparent",
        fontSize: "1rem",
        fontWeight: 500,
    }

    return (
        <div style={navStyle}>
            {/* for all pages, add a button */}
            {pageList.map((page) => (
                <button
                    key={page}
                    style={{
                        ...buttonStyle,
                        color: selected === page ? "#000" : "#aaa",
                        fontWeight: selected === page ? "bold" : "normal",
                    }}
                    onClick={() => setSelected(page)}
                >
                    {page}
                </button>
            ))}
        </div>
    );
};

export default TopNav;
