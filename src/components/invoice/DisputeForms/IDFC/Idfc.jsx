import {React, useRef, useState} from "react"
import Preview from "../../Components/Preview";
import "./idfc.css"
import idfcPg1 from "../../assets/Dispute-Forms/IDFC/IDFC_pg1.jpg"
import idfcPg2 from "../../assets/Dispute-Forms/IDFC/IDFC_pg2.jpg"
import html2pdf from "html2pdf.js";

export default function Idfc(){

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
  const [date, setDate] = useState("")
  const [phone, setPhone] = useState("")
  const [place, setPlace] = useState("")

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
  const handleMerchant1 = (element)=>{
    setMerchant1(element.target.value)
  }
  const handleMerchant2 = (element)=>{
    setMerchant2(element.target.value)
  }
  const handleMerchant3 = (element)=>{
    setMerchant3(element.target.value)
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
  const handleDate = (element)=>{
    setDate(element.target.value)
  }
  const handlePhone = (element)=>{
    setPhone(element.target.value)
  }
  const handlePlace = (element)=>{
    setPlace(element.target.value)
  }

  const dateArr = date.split('')
  const cardArr = card.split('')

    const invoiceRef = useRef();
    const handleDownload = ()=>{
      const element = invoiceRef.current;
      const options = {
        margin: 0,
        filename: 'DisputeForm.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 4 },
        jsPDF: { unit: 'in', format: [13.4,18.4], orientation: 'portrait' }
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
          <div>PHONE / FAX: </div>
          <input className="input" type="text" onChange={handlePhone} />
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
        <div className="icici-hr-light"></div>
        <button onClick={handleDownload}>DOWNLOAD</button>
      </div>
            <Preview title="PREVIEW IDFC DISPUTE FORM"/>

            <div className="idfc-form" ref={invoiceRef}>
                <img src={idfcPg1} alt="idfc pg1" />
                <img src={idfcPg2} alt="idfc pg2" />

                <div className="idfc-date idfc-font flex">
                  <div className="date-box-0">{dateArr[0]}</div>
                  <div className="date-box-1">{dateArr[1]}</div>
                  <div className="date-box-2">{dateArr[2]}</div>
                  <div className="date-box-3">{dateArr[3]}</div>
                  <div className="date-box-4">{dateArr[4]}</div>
                  <div className="date-box-5">{dateArr[5]}</div>
                  <div className="date-box-6">{dateArr[6]}</div>
                  <div className="date-box-7">{dateArr[7]}</div>
                </div>
                <div className="idfc-date-2 idfc-font flex">
                  <div className="date-box-0">{dateArr[0]}</div>
                  <div className="date-box-1">{dateArr[1]}</div>
                  <div className="date-box-2">{dateArr[2]}</div>
                  <div className="date-box-3">{dateArr[3]}</div>
                  <div className="date-box-4">{dateArr[4]}</div>
                  <div className="date-box-5">{dateArr[5]}</div>
                  <div className="date-box-6">{dateArr[6]}</div>
                  <div className="date-box-7">{dateArr[7]}</div>
                </div>

                <div className="idfc-card idfc-font">
                  <div className="idfc-c-1">{cardArr[0] + cardArr[1] + cardArr[3] + cardArr[4]}</div>
                  <div className="idfc-c-2">{cardArr[12] + cardArr[13] + cardArr[14] + cardArr[15]}</div>
                </div>

                <div className="idfc-place idfc-font">{place}</div>
                <div className="idfc-phone idfc-font">{phone}</div>
                <div className="idfc-name idfc-font">{name}</div>

                <div className="idfc-transaction-1 idfc-font">
        <div className="idfc-tra-date idfc-font">{tra1}</div>
        <div className="idfc-merchant idfc-font">{merchant1}</div>
        <div className="idfc-amount idfc-font">{amount1}</div>
        <div className="idfc-amount idfc-font">{amount1}</div>
        </div>
        <div className="idfc-transaction-2 idfc-font">
        <div className="idfc-tra-date idfc-font">{tra2}</div>
        <div className="idfc-merchant idfc-font">{merchant2}</div>
        <div className="idfc-amount idfc-font">{amount2}</div>
        <div className="idfc-amount idfc-font">{amount2}</div>
        </div>
        <div className="idfc-transaction-3 idfc-font">
        <div className="idfc-tra-date idfc-font">{tra3}</div>
        <div className="idfc-merchant idfc-font">{merchant3}</div>
        <div className="idfc-amount idfc-font">{amount3}</div>
        <div className="idfc-amount idfc-font">{amount3}</div>
        </div>
            </div>
        </>
    )
}