import {React, useState, useRef} from "react";
import html2pdf from "html2pdf.js";
import Preview from "../../Components/Preview";
import yesbankPg1 from "../../assets/Dispute-Forms/YESBANK/yes1.jpg"
import yesbankPg2 from "../../assets/Dispute-Forms/YESBANK/yes2.jpg"
import "./yesbank.css"

export default function Yesbank(){
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
  const [email, setEmail] = useState("")
  const [date, setDate] = useState("")
  const [mob, setMob] = useState("")

  const handleName = (element)=>{
    setName(element.target.value)
  }
  const handleMob = (element)=>{
    setMob(element.target.value)
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

  const nameArr = name.split('')
  const cardArr = card.split('')
  const emailArr = email.split('')

  const invoiceRef = useRef();

  const handleDownload = () => {
    const element = invoiceRef.current;
    const options = {
      margin: 0,
      filename: 'DisputeForm.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: [13.3, 17.6], orientation: 'portrait' }
    };

    html2pdf()
      .from(element)
      .set(options)
      .save();
  };

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
          <div>EMAIL: </div>
          <input className="input" type="text" onChange={handleEmail} />
        </div>
        <div className="flex icici-ends gap-10">
          <div>CARD NUMBER: </div>
          <input className="input" type="text" onChange={handleCard} />
        </div>
        <div className="flex icici-ends gap-10">
          <div>MOB NUMBER: </div>
          <input className="input" type="text" onChange={handleMob} />
        </div>
        <div className="icici-hr-light"></div>
        <div className="flex">
          <div className="flex gap-10">
            <div>TRANSACTION DATE: </div>
            <input className="input" type="text"  onChange={handleTra1}/>
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
            <Preview title="PREVIEW YES BANK DISPUTE FORM"/>

            <div className="yesbank-form" ref={invoiceRef}>
                <img src={yesbankPg1} alt="yes-pg1" />
                <img src={yesbankPg2} alt="yes-pg2" />

                <div className="yes-name-box yes-font">
                    <div className="yes-inner-box">{nameArr[0]}</div>
                    <div className="yes-inner-box">{nameArr[1]}</div>
                    <div className="yes-inner-box">{nameArr[2]}</div>
                    <div className="yes-inner-box">{nameArr[3]}</div>
                    <div className="yes-inner-box">{nameArr[4]}</div>
                    <div className="yes-inner-box">{nameArr[5]}</div>
                    <div className="yes-inner-box">{nameArr[6]}</div>
                    <div className="yes-inner-box">{nameArr[7]}</div>
                    <div className="yes-inner-box">{nameArr[8]}</div>
                    <div className="yes-inner-box">{nameArr[9]}</div>
                    <div className="yes-inner-box">{nameArr[10]}</div>
                    <div className="yes-inner-box">{nameArr[11]}</div>
                    <div className="yes-inner-box">{nameArr[12]}</div>
                    <div className="yes-inner-box">{nameArr[13]}</div>
                    <div className="yes-inner-box">{nameArr[14]}</div>
                    <div className="yes-inner-box">{nameArr[15]}</div>
                    <div className="yes-inner-box">{nameArr[16]}</div>
                    <div className="yes-inner-box">{nameArr[17]}</div>
                    <div className="yes-inner-box">{nameArr[18]}</div>
                    <div className="yes-inner-box">{nameArr[19]}</div>
                    <div className="yes-inner-box">{nameArr[20]}</div>
                    <div className="yes-inner-box">{nameArr[21]}</div>
                    <div className="yes-inner-box">{nameArr[22]}</div>
                    <div className="yes-inner-box">{nameArr[23]}</div>
                    <div className="yes-inner-box">{nameArr[24]}</div>
                </div>
                
                <div className="yes-card-box-1  yes-font">
                    <div className="yes-inner-box">{cardArr[0]}</div>
                    <div className="yes-inner-box">{cardArr[1]}</div>
                    <div className="yes-inner-box">{cardArr[2]}</div>
                    <div className="yes-inner-box">{cardArr[3]}</div>
                    <div className="yes-inner-box">{cardArr[4]}</div>
                    <div className="yes-inner-box">{cardArr[5]}</div>
                </div>
                <div className="yes-card-box-2  yes-font">
                    <div className="yes-inner-box">{cardArr[12]}</div>
                    <div className="yes-inner-box">{cardArr[13]}</div>
                    <div className="yes-inner-box">{cardArr[14]}</div>
                    <div className="yes-inner-box">{cardArr[15]}</div>
                </div>

                <div className="yes-mob-no yes-font">{mob}</div>

                <div className="yes-email-box yes-font">
                    <div className="yes-inner-box">{emailArr[0]}</div>
                    <div className="yes-inner-box">{emailArr[1]}</div>
                    <div className="yes-inner-box">{emailArr[2]}</div>
                    <div className="yes-inner-box">{emailArr[3]}</div>
                    <div className="yes-inner-box">{emailArr[4]}</div>
                    <div className="yes-inner-box">{emailArr[5]}</div>
                    <div className="yes-inner-box">{emailArr[6]}</div>
                    <div className="yes-inner-box">{emailArr[7]}</div>
                    <div className="yes-inner-box">{emailArr[8]}</div>
                    <div className="yes-inner-box">{emailArr[9]}</div>
                    <div className="yes-inner-box">{emailArr[10]}</div>
                    <div className="yes-inner-box">{emailArr[11]}</div>
                    <div className="yes-inner-box">{emailArr[12]}</div>
                    <div className="yes-inner-box">{emailArr[13]}</div>
                    <div className="yes-inner-box">{emailArr[14]}</div>
                    <div className="yes-inner-box">{emailArr[15]}</div>
                    <div className="yes-inner-box">{emailArr[16]}</div>
                    <div className="yes-inner-box">{emailArr[17]}</div>
                    <div className="yes-inner-box">{emailArr[18]}</div>
                    <div className="yes-inner-box">{emailArr[19]}</div>
                    <div className="yes-inner-box">{emailArr[20]}</div>
                    <div className="yes-inner-box">{emailArr[21]}</div>
                    <div className="yes-inner-box">{emailArr[22]}</div>
                    <div className="yes-inner-box">{emailArr[23]}</div>
                    <div className="yes-inner-box">{emailArr[24]}</div>
                </div>

                <div className="yes-transaction-1">
        <div className="yes-transaction-date yes-font">{tra1}</div>
        <div className="yes-merchant yes-font">{merchant1}</div>
        <div className="yes-amount yes-font">{amount1}</div>
        <div className="yes-amount yes-font">{amount1}</div>
        </div>
        <div className="yes-transaction-2">
        <div className="yes-transaction-date yes-font">{tra2}</div>
        <div className="yes-merchant yes-font">{merchant2}</div>
        <div className="yes-amount yes-font">{amount2}</div>
        <div className="yes-amount yes-font">{amount2}</div>
        </div>
        <div className="yes-transaction-3">
        <div className="yes-transaction-date yes-font">{tra3}</div>
        <div className="yes-merchant yes-font">{merchant3}</div>
        <div className="yes-amount yes-font">{amount3}</div>
        <div className="yes-amount yes-font">{amount3}</div>
        </div>
        <div className="yes-transaction-4">
        <div className="yes-transaction-date yes-font">{tra4}</div>
        <div className="yes-merchant yes-font">{merchant4}</div>
        <div className="yes-amount yes-font">{amount4}</div>
        <div className="yes-amount yes-font">{amount4}</div>
        </div>
        <div className="yes-transaction-5">
        <div className="yes-transaction-date yes-font">{tra5}</div>
        <div className="yes-merchant yes-font">{merchant5}</div>
        <div className="yes-amount yes-font">{amount5}</div>
        <div className="yes-amount yes-font">{amount5}</div>
        </div>

        <div className="yes-name-down yes-font">{name}</div>
        <div className="yes-name-sign yes-sign">{name}</div>

        <div className="yes-date yes-font">{date}</div>
            </div>
            
        </>
    )
}