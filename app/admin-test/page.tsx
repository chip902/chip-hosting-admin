export default function TestAdminPage() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Test Admin Page</h1>
      <p>This is a test admin page to check if route isolation works.</p>
      <p>If you see main app navigation above this, then route groups aren't working properly.</p>
    </div>
  );
}
