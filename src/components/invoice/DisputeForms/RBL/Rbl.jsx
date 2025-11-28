import {React, useState, useRef} from "react"
import Preview from "../../Components/Preview";
import rblpg1 from "../../assets/Dispute-Forms/RBL/RBL_pg1.jpg"
import rblpg2 from "../../assets/Dispute-Forms/RBL/RBL_pg2.jpg"
import "./rbl.css"
import html2pdf from "html2pdf.js";

export default function Rbl(){
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
    const [email, setEmail] = useState("")
    const [date, setDate] = useState("")
    const [statement1, setStatement1] = useState("")
    const [statement2, setStatement2] = useState("")
    const [statement3, setStatement3] = useState("")
    const [statement4, setStatement4] = useState("")

    const handleName = (element)=>{
      setName(element.target.value)
    }
    const handleEmail = (element)=>{
      setEmail(element.target.value)
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
    const handleStatement1 = (element)=>{
      setStatement1(element.target.value)
    }
    const handleStatement2 = (element)=>{
      setStatement2(element.target.value)
    }
    const handleStatement3 = (element)=>{
      setStatement3(element.target.value)
    }
    const handleStatement4 = (element)=>{
      setStatement4(element.target.value)
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
          <div className="flex gap-10">
            <div>STATEMENT DATE: </div>
            <input className="input" type="text" onChange={handleStatement1} />
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
          <div className="flex gap-10">
            <div>STATEMENT DATE: </div>
            <input className="input" type="text" onChange={handleStatement2} />
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
          <div className="flex gap-10">
            <div>STATEMENT DATE: </div>
            <input className="input" type="text" onChange={handleStatement3} />
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
          <div className="flex gap-10">
            <div>STATEMENT DATE: </div>
            <input className="input" type="text" onChange={handleStatement4} />
          </div>
        </div>
        <div className="icici-hr-light"></div>
        <button onClick={handleDownload}>DOWNLOAD</button>
      </div>
            <Preview title="PREVIEW RBL DISPUTE FORM"/>

            <div className="rbl-form" ref={invoiceRef}>
                <img src={rblpg1} alt="rbl page 1" />
                <img src={rblpg2} alt="rbl page 2" />

                <div className="rbl-name rbl-font">{name}</div>
                <div className="rbl-card rbl-font">{card}</div>
                <div className="rbl-phone rbl-font">{phone}</div>
                <div className="rbl-email rbl-font">{email}</div>
                <div className="rbl-date rbl-font">{date}</div>

                <div className="rbl-transaction-1 rbl-font">
        <div className="rbl-transaction-date rbl-font">{tra1}</div>
        <div className="rbl-merchant rbl-font">{merchant1}</div>
        <div className="rbl-amount rbl-font">{amount1}</div>
        <div className="rbl-amount rbl-font">{amount1}</div>
        </div>
        <div className="rbl-transaction-2 rbl-font">
        <div className="rbl-transaction-date rbl-font">{tra2}</div>
        <div className="rbl-merchant rbl-font">{merchant2}</div>
        <div className="rbl-amount rbl-font">{amount2}</div>
        <div className="rbl-amount rbl-font">{amount2}</div>
        </div>
        <div className="rbl-transaction-3 rbl-font">
        <div className="rbl-transaction-date rbl-font">{tra3}</div>
        <div className="rbl-merchant rbl-font">{merchant3}</div>
        <div className="rbl-amount rbl-font">{amount3}</div>
        <div className="rbl-amount rbl-font">{amount3}</div>
        </div>
        <div className="rbl-transaction-4 rbl-font">
        <div className="rbl-transaction-date rbl-font">{tra4}</div>
        <div className="rbl-merchant rbl-font">{merchant4}</div>
        <div className="rbl-amount rbl-font">{amount4}</div>
        <div className="rbl-amount rbl-font">{amount4}</div>
        </div>

        <div className="rbl-sign-1 rbl-sig">{name}</div>
        <div className="rbl-sign-2 rbl-sig">{name}</div>
        
        <div className="rbl-statement-1 rbl-font">{statement1}</div>
        <div className="rbl-statement-2 rbl-font">{statement2}</div>
        <div className="rbl-statement-3 rbl-font">{statement3}</div>
        <div className="rbl-statement-4 rbl-font">{statement4}</div>
            </div>
        </>
    )
}