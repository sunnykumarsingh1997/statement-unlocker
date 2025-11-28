import {React, useRef, useState} from "react"
import html2pdf from "html2pdf.js";
import p1 from "../../assets/Dispute-Forms/ICICI/p1.jpg"
import p2 from "../../assets/Dispute-Forms/ICICI/p2.jpg"
import Preview from "../../Components/Preview";
import Tick from "../../Components/Tick";

import "./icici.css"

export default function Icici(){

    const [name, setName] = useState("")
    const [card, setCard] = useState()
    const [tra1, settra1] = useState("")
    const [merchant1, setMerchant1] = useState("")
    const [amount1, setAmount1] = useState("")
    const [tra2, setTra2] = useState("")
    const [merchant2, setMerchant2] = useState("")
    const [amount2, setAmount2] = useState("")
    const [tra3, setTra3] = useState("")
    const [merchant3, setMerchant3] = useState("")
    const [amount3, setAmount3] = useState("")
    const [tra4, setTra4] = useState("")
    const [merchant4, setMerchant4] = useState("")
    const [amount4, setAmount4] = useState("")
    const [phone, setPhone] = useState("")
    const [date, setDate] = useState("")

    const handleName = (element)=>{
        setName(element.target.value)
      }
      const handleCard = (element)=>{
        setCard(element.target.value)
      }
      const handleTra1 = (element)=>{
        settra1(element.target.value)
      }
      const handleTra2 = (element)=>{
        setTra2(element.target.value)
      }
      const handleTra3 = (element)=>{
        setTra3(element.target.value)
      }
      const handleTra4 = (element)=>{
        setTra4(element.target.value)
      }
      const handleMerchant1 = (element)=>{
        setMerchant1(element.target.value)
      }
      const handleMerchant2 = (element)=>{
        setMerchant2(element.target.value)
      }
      const handleMerchant3 = (element)=>{
        setMerchant3(element.target.value)
      }
      const handleMerchant4 = (element)=>{
        setMerchant4(element.target.value)
      }
      const handleAmount1 = (element)=>{
        setAmount1(element.target.value)
      }
      const handleAmount2 = (element)=>{
        setAmount2(element.target.value)
      }
      const handleAmount3 = (element)=>{
        setAmount3(element.target.value)
      }
      const handleAmount4 = (element)=>{
        setAmount4(element.target.value)
      }
      const handleDate = (element)=>{
        setDate(element.target.value)
      }
      const handlePhone = (element)=>{
        setPhone(element.target.value)
      }

  const invoiceRef = useRef();

  const handleDownload = () => {
    const element = invoiceRef.current;
    const options = {
      margin: 0,
      filename: 'DisputeForm.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: [13.7, 19], orientation: 'portrait' }
    };

    html2pdf()
      .from(element)
      .set(options)
      .save();
  };

  const cardNumber = card;
    const cardDigits = Array.from(String(cardNumber), Number);
    return(
        <>
        
        <div className="input-fields">
            <div className="flex icici-ends gap-10">
                <div>Today's Date: </div>
                <input className="input" type="text"  onChange={handleDate}/>
            </div>
            <div className="flex icici-ends gap-10">
                <div>NAME: </div>
                <input className="input" type="text"  onChange={handleName}/>
            </div>
            <div className="flex icici-ends gap-10">
                <div>PHONE / FAX: </div>
                <input className="input" type="text"  onChange={handlePhone}/>
            </div>
            <div className="flex icici-ends gap-10">
                <div>CARD NUMBER: </div>
                <input className="input" type="text" onChange={handleCard} />
            </div>
            <div className="icici-hr-light"></div>
            <div className="flex">
            <div className="flex gap-10">
                <div>TRANSACTION DATE: </div>
                <input className="input" type="text"  onChange={handleTra1}/>
            </div>
            <div className="flex gap-10">
                <div>MERCHANT: </div>
                <input className="input" type="text"  onChange={handleMerchant1}/>
            </div>
            <div className="flex gap-10">
                <div>TRANSACTION / DISPUTED AMOUNT: </div>
                <input className="input" type="text"  onChange={handleAmount1}/>
            </div>
            </div>
            <div className="flex">
            <div className="flex gap-10">
                <div>TRANSACTION DATE: </div>
                <input className="input" type="text"  onChange={handleTra2}/>
            </div>
            <div className="flex gap-10">
                <div>MERCHANT: </div>
                <input className="input" type="text"  onChange={handleMerchant2}/>
            </div>
            <div className="flex gap-10">
                <div>TRANSACTION / DISPUTED AMOUNT: </div>
                <input className="input" type="text"  onChange={handleAmount2}/>
            </div>
            </div>
            <div className="flex">
            <div className="flex gap-10">
                <div>TRANSACTION DATE: </div>
                <input className="input" type="text"  onChange={handleTra3}/>
            </div>
            <div className="flex gap-10">
                <div>MERCHANT: </div>
                <input className="input" type="text"  onChange={handleMerchant3}/>
            </div>
            <div className="flex gap-10">
                <div>TRANSACTION / DISPUTED AMOUNT: </div>
                <input className="input" type="text"  onChange={handleAmount3}/>
            </div>
            </div>
            <div className="flex">
            <div className="flex gap-10">
                <div>TRANSACTION DATE: </div>
                <input className="input" type="text"  onChange={handleTra4}/>
            </div>
            <div className="flex gap-10">
                <div>MERCHANT: </div>
                <input className="input" type="text"  onChange={handleMerchant4}/>
            </div>
            <div className="flex gap-10">
                <div>TRANSACTION / DISPUTED AMOUNT: </div>
                <input className="input" type="text"  onChange={handleAmount4}/>
            </div>
            
            </div>
            <div className="icici-hr-light"></div>
            <button onClick={handleDownload}>DOWNLOAD</button>
        </div>

        <Preview title="PREVIEW ICICI DISPUTE FORM"/>

        <div className="icici-invoice " ref={invoiceRef}>
            <img src={p1} alt="icici page 1" />
            <img src={p2} alt="icici page 2" />

            <div className="icici-name icici-font">{name}</div>
            <div className="icici-phone icici-font">{phone}</div>
            <div className="icici-date icici-font">{date}</div>
            <div className="sig-1 icici-dancing-script-sig">{name}</div>
            
            <div className="icici-card-num1 icici-font">
            <div>{cardDigits[0]}</div>
            <div>{cardDigits[1]}</div>
            <div>{cardDigits[2]}</div>
            <div>{cardDigits[3]}</div> 
            </div>
            <div className="icici-card-num2 icici-font">
            <div>{cardDigits[4]}</div>
            <div>{cardDigits[5]}</div>
            <div>{cardDigits[6]}</div>
            <div>{cardDigits[7]}</div> 
            </div>
            <div className="icici-card-num3 icici-font">
            <div>{cardDigits[8]}</div>
            <div>{cardDigits[9]}</div>
            <div>{cardDigits[10]}</div>
            <div>{cardDigits[11]}</div> 
            </div>
            <div className="icici-card-num4  icici-font">
            <div>{cardDigits[12]}</div>
            <div>{cardDigits[13]}</div>
            <div>{cardDigits[14]}</div>
            <div>{cardDigits[15]}</div> 
            </div>

            <div className="icici-transaction-1 icici-font">
        <div className="icici-transaction-date icici-font">{tra1}</div>
        <div className="icici-merchant icici-font">{merchant1}</div>
        <div className="icici-amount icici-font">{amount1}</div>
        <div className="icici-amount icici-font">{amount1}</div>
        </div>
        <div className="icici-transaction-2 icici-font">
        <div className="icici-transaction-date icici-font">{tra2}</div>
        <div className="icici-merchant icici-font">{merchant2}</div>
        <div className="icici-amount icici-font">{amount2}</div>
        <div className="icici-amount icici-font">{amount2}</div>
        </div>
        <div className="icici-transaction-3 icici-font">
        <div className="icici-transaction-date icici-font">{tra3}</div>
        <div className="icici-merchant icici-font">{merchant3}</div>
        <div className="icici-amount icici-font">{amount3}</div>
        <div className="icici-amount icici-font">{amount3}</div>
        </div>
        <div className="icici-transaction-4 icici-font">
        <div className="icici-transaction-date icici-font">{tra4}</div>
        <div className="icici-merchant icici-font">{merchant4}</div>
        <div className="icici-amount icici-font">{amount4}</div>
        <div className="icici-amount icici-font">{amount4}</div>
        
        </div>
        </div>
        
        </>
    )
}