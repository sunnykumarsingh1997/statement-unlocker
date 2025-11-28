import {React, useState, useRef} from "react"
import Preview from "../../Components/Preview";
import "./indusind.css"
import indusPg1 from "../../assets/Dispute-Forms/INDUSIND/indus_pg1.jpg"
import tick from "../../assets/tick.png"
import html2pdf from "html2pdf.js";

export default function Indusind(){
  const [name, setName ] = useState(" ")
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

  const nameArr = name.split('')

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
            <input className="input" type="text" onChange={handleTra2}/>
          </div>
          <div className="flex gap-10">
            <div>MERCHANT: </div>
            <input className="input" type="text" onChange={handleMerchant2} />
          </div>
          <div className="flex gap-10">
            <div>TRANSACTION / DISPUTED AMOUNT: </div>
            <input className="input" type="text"  onChange={handleAmount2}/>
          </div>
        </div>
        <div className="flex">
          <div className="flex gap-10">
            <div>TRANSACTION DATE: </div>
            <input className="input" type="text" onChange={handleTra3} />
          </div>
          <div className="flex gap-10">
            <div>MERCHANT: </div>
            <input className="input" type="text" onChange={handleMerchant3}/>
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
            <Preview title="PREVIEW INDUSIND DISPUTE FORM"/>

            <div className="indusind-form" ref={invoiceRef}>
                <img src={indusPg1} alt="indus form" />

                <div className="indus-card indus-font">{card}</div>
                <div className="indus-name indus-font">{Array.from({ length: 30 }).map((_, index) => (
        <div key={index} className={`indus-name-box-${index + 1}`}>
          {nameArr[index]}
        </div>
      ))}</div>

      <div className="indus-tick"><img src={tick} alt="tick" /></div>
      <div className="indus-date indus-font">{date}</div>
      <div className="indus-sig">{name}</div>

      <div className="indus-transaction-1 indus-font">
        
        <div className="indus-merchant indus-font">{merchant1}</div>
        <div className="indus-tra-date indus-font">{tra1}</div>
        <div className="indus-amount-1 indus-font">{amount1}</div>
        <div className="indus-amount-2 indus-font">{amount1}</div>
        </div>
        <div className="indus-transaction-2 indus-font">
       
        <div className="indus-merchant indus-font">{merchant2}</div>
        <div className="indus-tra-date indus-font">{tra2}</div>
        <div className="indus-amount-1 indus-font">{amount2}</div>
        <div className="indus-amount-2 indus-font">{amount2}</div>
        </div>
        <div className="indus-transaction-3 indus-font">

        <div className="indus-merchant indus-font">{merchant3}</div>
        <div className="indus-tra-date indus-font">{tra3}</div>
         <div className="indus-amount-1 indus-font">{amount3}</div>
         <div className="indus-amount-2 indus-font">{amount3}</div>
        </div>
        <div className="indus-transaction-4 indus-font">

        <div className="indus-merchant indus-font">{merchant4}</div>
        <div className="indus-tra-date indus-font">{tra4}</div>
        <div className="indus-amount-1 indus-font">{amount4}</div>
        <div className="indus-amount-2 indus-font">{amount4}</div>
        </div>
        <div className="indus-transaction-5 indus-font">

        <div className="indus-merchant indus-font">{merchant5}</div>
        <div className="indus-tra-date indus-font">{tra5}</div>
        <div className="indus-amount-1 indus-font">{amount5}</div>
        <div className="indus-amount-2 indus-font">{amount5}</div>
        </div>
            </div>
        </>
    )
}