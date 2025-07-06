import './admin.css'

type Args = {
  children: React.ReactNode
}

const CustomAdminLayout = ({ children }: Args) => (
  <div className="custom-admin" style={{
    display: 'flex',
    height: '100vh',
    width: '100vw',
    position: 'fixed',
    top: 0,
    left: 0,
    zIndex: 10000,
    background: '#fff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", sans-serif'
  }}>
    <div className="admin-sidebar" style={{
      width: '250px',
      background: '#1a1a1a',
      color: 'white',
      padding: 0,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div className="admin-logo" style={{
        padding: '20px',
        borderBottom: '1px solid #333'
      }}>
        <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: 600, margin: 0 }}>Chip Hosting CMS</h2>
      </div>
      <nav className="admin-nav" style={{ flex: 1, padding: '20px 0' }}>
        <a href="/admin" className="nav-link" style={{
          display: 'block',
          padding: '12px 20px',
          color: '#ccc',
          textDecoration: 'none',
          borderLeft: '3px solid transparent'
        }}>Dashboard</a>
        <a href="/admin/users" className="nav-link" style={{
          display: 'block',
          padding: '12px 20px',
          color: '#ccc',
          textDecoration: 'none',
          borderLeft: '3px solid transparent'
        }}>Users</a>
        <a href="/admin/posts" className="nav-link" style={{
          display: 'block',
          padding: '12px 20px',
          color: '#ccc',
          textDecoration: 'none',
          borderLeft: '3px solid transparent'
        }}>Posts</a>
        <a href="/admin/settings" className="nav-link" style={{
          display: 'block',
          padding: '12px 20px',
          color: '#ccc',
          textDecoration: 'none',
          borderLeft: '3px solid transparent'
        }}>Settings</a>
      </nav>
    </div>
    <div className="admin-main" style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <header className="admin-header" style={{
        background: '#fff',
        borderBottom: '1px solid #e1e5e9',
        padding: '20px 30px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#1a1a1a', margin: 0 }}>Admin Panel</h1>
        <div className="admin-user" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span style={{ color: '#666', fontSize: '14px' }}>Admin User</span>
          <a href="/" className="back-to-site" style={{
            color: '#0066cc',
            textDecoration: 'none',
            fontSize: '14px',
            padding: '8px 16px',
            border: '1px solid #0066cc',
            borderRadius: '4px'
          }}>← Back to Site</a>
        </div>
      </header>
      <main className="admin-content" style={{
        flex: 1,
        padding: '30px',
        overflowY: 'auto',
        background: '#f8f9fa'
      }}>
        {children}
      </main>
    </div>
  </div>
)

export default CustomAdminLayout
