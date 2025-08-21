import SimpleImageUpload from "@/components/SimpleImageUpload";

export default function TestOCRPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
          🧪 OCR 功能测试页面
        </h1>
        <SimpleImageUpload />
      </div>
    </div>
  );
}
