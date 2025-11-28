import React from "react"
import "./componentCSS/preview.css"

export default function Preview(props){
    return(
        <>
        <div className="stripe-preview">{props.title}</div>
        </>
    )
}