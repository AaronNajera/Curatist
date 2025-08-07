import './styles/globals.css';
export const metadata = { title: 'Photographer Posting Pack' };
export default function RootLayout({ children }){
  return (
    <html lang="en">
      <body>
        <div className="container">
          <h1>Photographer Posting Pack</h1>
          {children}
          <div className="footer"><small className="muted">No-backend prototype — all data stays in your browser</small></div>
        </div>
      </body>
    </html>
  );
}
