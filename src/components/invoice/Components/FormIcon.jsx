import React from "react";
import "./componentCSS/formIcon.css"

export default function FormIcon(props){
    return(
        <>
        <div className="form-icon">
            <img src={props.image} alt="HDFC ICON" />
            <div className="formIcon-title">{props.title}</div>
        </div>
        </>
    )
}