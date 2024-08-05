import { useState, useEffect } from "react";


const KwikpassSSOButton = ({title, status = false}) => {  
    const [buttonStatus, setButtonStatus] = useState(status);
    const styles = {
    padding: '0.675rem',
    fontSize: '0.875rem',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    background: 'none',
    border: '1px solid #0070f3',
    color: '#0070f3',
    }
    const getKpMerchantToken = async() => {
           const token = await loginFunctions.kpCustomMerchantLogin();
           if(token){
               // do something
               console.log(token);
           }
    } 
    useEffect(() => {    
    const handleCustomEvent = (event) => { 
          console.log(event) ;      
          setButtonStatus(event?.detail?.type);               
     }
    window.addEventListener("sso-button-event", handleCustomEvent);
    return () => {
      console.log('Cleanup function called');
    };
  },[]);  
 return (<>
  {buttonStatus && <button style={styles} onClick={getKpMerchantToken}>
    {title}
  </button>
  }
  </>)
}
export default KwikpassSSOButton;