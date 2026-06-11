import { QRCodeSVG } from 'qrcode.react';

interface PassengerQRCodeProps {
  identifier: string;
}

const PassengerQRCode = ({ identifier } : PassengerQRCodeProps) => {
  return (
    <div className="flex flex-col items-center justify-center p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-center text-xl font-bold mb-4">Identificador para Embarque</h2>
      
      <QRCodeSVG 
        value={identifier} 
        size={200}
        bgColor={"#ffffff"}
        fgColor={"#000000"}
        level={"M"}
        marginSize={2}
      />
      
    </div>
  );
};

export default PassengerQRCode;