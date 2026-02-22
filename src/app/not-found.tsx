export default function RootNotFound() {
  return (
    <html>
      <body className="flex h-screen items-center justify-center font-sans">
        <div className="text-center">
          <h1 className="text-3xl font-bold">404 - Page Not Found</h1>
          <p className="mt-2 text-gray-600">Please visit <a href="/en" className="text-blue-500 hover:underline">lingdb.com/en</a></p>
        </div>
      </body>
    </html>
  );
}
