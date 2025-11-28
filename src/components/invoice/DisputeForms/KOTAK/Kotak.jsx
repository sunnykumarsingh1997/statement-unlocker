import {React, useState, useRef} from "react";
import "./kotak.css"
import Preview from "../../Components/Preview";
import kotakPg1 from "../../assets/Dispute-Forms/KOTAK/kotak-pg1.jpg"
import kotakPg2 from "../../assets/Dispute-Forms/KOTAK/kotak-pg2.jpg"
import tick from "../../assets/tick.png"
import html2pdf from "html2pdf.js";

export default function Kotak(){
  const [name, setName] = useState("")
  const [card, setCard] = useState("")
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
  const [tra5, setTra5] = useState("")
  const [merchant5, setMerchant5] = useState("")
  const [amount5, setAmount5] = useState("")
  const [date, setDate] = useState("")
  const [email, setEmail] = useState("")

  const [creditTick, setcreditTick] = useState(true)
  const [debitTick, setdebitTick] = useState(true)

  const dateArr = date.split('')

  const nameArr = name.split('')
  const emailArr = email.split('')

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
  const handleTra5 = (element)=>{
    setTra5(element.target.value)
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
  const handleMerchant5 = (element)=>{
    setMerchant5(element.target.value)
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
  const handleAmount5 = (element)=>{
    setAmount5(element.target.value)
  }
  const handleDate = (element)=>{
    setDate(element.target.value)
  }
  const handleEmail = (element)=>{
    setEmail(element.target.value)
  }

  const handleDebitClick = () =>{
    setdebitTick(!debitTick)
  }
  const handleCreditClick = () =>{
    setcreditTick(!creditTick)
  }

  const invoiceRef = useRef();
  const handleDownload = ()=>{
    const element = invoiceRef.current;
    const options = {
      margin: 0,
      filename: 'DisputeForm.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 4 },
      jsPDF: { unit: 'in', format: [12.8,18.4], orientation: 'portrait' }
    };
    
    html2pdf()
      .from(element)
      .set(options)
      .save();
  }

    return(
        <>
            <div className="input-fields">
        <div className="flex icici-ends gap-10">
          <div>Today's Date: </div>
          <input className="input" type="text" onChange={handleDate} />
        </div>
        <div className="flex icici-ends gap-10">
          <div>NAME: </div>
          <input className="input" type="text" onChange={handleName} />
        </div>
        <div className="flex icici-ends gap-10">
          <div>CARD NUMBER: </div>
          <input className="input" type="text" onChange={handleCard} />
        </div>
        <div className="flex icici-ends gap-10">
          <div>EMAIL: </div>
          <input className="input" type="text" onChange={handleEmail} />
        </div>
        <div className="icici-hr-light"></div>
        <div className="flex">
          <div className="flex gap-10">
            <div>TRANSACTION DATE: </div>
            <input className="input" type="text" onChange={handleTra1} />
          </div>
          <div className="flex gap-10">
            <div>MERCHANT: </div>
            <input className="input" type="text" onChange={handleMerchant1} />
          </div>
          <div className="flex gap-10">
            <div>TRANSACTION / DISPUTED AMOUNT: </div>
            <input className="input" type="text" onChange={handleAmount1} />
          </div>
        </div>
        <div className="flex">
          <div className="flex gap-10">
            <div>TRANSACTION DATE: </div>
            <input className="input" type="text" onChange={handleTra2} />
          </div>
          <div className="flex gap-10">
            <div>MERCHANT: </div>
            <input className="input" type="text" onChange={handleMerchant2} />
          </div>
          <div className="flex gap-10">
            <div>TRANSACTION / DISPUTED AMOUNT: </div>
            <input className="input" type="text" onChange={handleAmount2} />
          </div>
        </div>
        <div className="flex">
          <div className="flex gap-10">
            <div>TRANSACTION DATE: </div>
            <input className="input" type="text" onChange={handleTra3} />
          </div>
          <div className="flex gap-10">
            <div>MERCHANT: </div>
            <input className="input" type="text" onChange={handleMerchant3} />
          </div>
          <div className="flex gap-10">
            <div>TRANSACTION / DISPUTED AMOUNT: </div>
            <input className="input" type="text" onChange={handleAmount3} />
          </div>
        </div>
        <div className="flex">
          <div className="flex gap-10">
            <div>TRANSACTION DATE: </div>
            <input className="input" type="text" onChange={handleTra4} />
          </div>
          <div className="flex gap-10">
            <div>MERCHANT: </div>
            <input className="input" type="text" onChange={handleMerchant4} />
          </div>
          <div className="flex gap-10">
            <div>TRANSACTION / DISPUTED AMOUNT: </div>
            <input className="input" type="text" onChange={handleAmount4} />
          </div>
        </div>
        <div className="flex">
          <div className="flex gap-10">
            <div>TRANSACTION DATE: </div>
            <input className="input" type="text" onChange={handleTra5} />
          </div>
          <div className="flex gap-10">
            <div>MERCHANT: </div>
            <input className="input" type="text" onChange={handleMerchant5} />
          </div>
          <div className="flex gap-10">
            <div>TRANSACTION / DISPUTED AMOUNT: </div>
            <input className="input" type="text" onChange={handleAmount5} />
          </div>
        </div>
        <div className="icici-hr-light"></div>
        <button onClick={handleDownload}>DOWNLOAD</button>
      </div>

            <Preview title="PREVIEW KOTAK DISPUTE FORM"/>

            <div className="kotak-form" ref={invoiceRef}>
                <img src={kotakPg1} alt="" />
                <img src={kotakPg2} alt="" />

                <div onClick={handleDebitClick}><div className="kotak-tick-debit">{debitTick && <img src={tick} alt="tock" />}</div></div>
                <div onClick={handleCreditClick}><div className="kotak-tick-credit">{creditTick && <img src={tick} alt="tock" />}</div></div>

                <div className="kotak-name kotak-font">{Array.from({ length: 30 }).map((_, index) => (
        <div key={index} className={`kotak-name-box-${index + 1} kotak-box`}>
          {nameArr[index]}
        </div> 
      ))}</div>

            <div className="kotak-card kotak-font">{card}</div>
            <div className="refund-tick"><img src={tick} alt="" /></div>

            <div className="kotak-sig-1">{name}</div>
            <div className="kotak-sig-2">{name}</div>
            <div className="kotak-today-day kotak-font">
              <div className="k-d-1">{dateArr[0]}</div>
              <div className="k-d-1">{dateArr[1]}</div>
              <div className="k-d-1">{dateArr[2]}</div>
              <div className="k-d-1">{dateArr[3]}</div>
              <div className="kotak-year">
                <div>{dateArr[4]}</div>
                <div>{dateArr[5]}</div>
                <div>{dateArr[6]}</div>
                <div>{dateArr[7]}</div>
              </div>
              </div>

              <div className="kotak-transaction-1 kotak-font">
        <div className="kotak-tra-date kotak-font">{tra1}</div>
        <div className="kotak-merchant kotak-font">{merchant1}</div>
        <div className="kotak-amount-1 kotak-font">{amount1}</div>
        <div className="kotak-amount-2 kotak-font">{amount1}</div>
        </div>
        <div className="kotak-transaction-2 kotak-font">
        <div className="kotak-tra-date kotak-font">{tra2}</div>
        <div className="kotak-merchant kotak-font">{merchant2}</div>
        <div className="kotak-amount-1 kotak-font">{amount2}</div>
        <div className="kotak-amount-2 kotak-font">{amount2}</div>
        </div>
        <div className="kotak-transaction-3 kotak-font">
        <div className="kotak-tra-date kotak-font">{tra3}</div>
        <div className="kotak-merchant kotak-font">{merchant3}</div>
         <div className="kotak-amount-1 kotak-font">{amount3}</div>
         <div className="kotak-amount-2 kotak-font">{amount3}</div>
        </div>
        <div className="kotak-transaction-4 kotak-font">
        <div className="kotak-tra-date kotak-font">{tra4}</div>
        <div className="kotak-merchant kotak-font">{merchant4}</div>
        <div className="kotak-amount-1 kotak-font">{amount4}</div>
        <div className="kotak-amount-2 kotak-font">{amount4}</div>
        </div>
        <div className="kotak-transaction-5 kotak-font">
        <div className="kotak-tra-date kotak-font">{tra5}</div>
        <div className="kotak-merchant kotak-font">{merchant5}</div>
        <div className="kotak-amount-1 kotak-font">{amount5}</div>
        <div className="kotak-amount-2 kotak-font">{amount5}</div>
        </div>

        <div className="kotak-email kotak-font">{Array.from({ length: 30 }).map((_, index) => (
        <div key={index} className={`axis-name-box-${index + 1}`}>
          {emailArr[index]}
        </div>
      ))}</div>
            </div>
        </>
    )
}