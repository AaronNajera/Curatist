
import './styles/globals.css';
export const metadata = { title: 'Curatist' };
export default function RootLayout({ children }){
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Playfair+Display:wght@500;600&display=swap" rel="stylesheet" />
      </head>
      <body>
        <div className="container">
          <div className="header">
            <a className="btn secondary" href="/">Home</a>
            <div className="logo">Curatist</div>
            <div></div>
          </div>
          {children}
          <div style={{marginTop:24}}><small style={{color:'#666'}}>Client-only prototype — data stays in your browser</small></div>
        </div>
      </body>
    </html>
  );
}
