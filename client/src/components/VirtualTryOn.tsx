import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Camera, Upload, Sparkles, X, Loader2, MessageCircle, Send } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface HairstyleOption {
  style_name: string;
  tag: string;
  services_needed: string;
}

interface GeneratedStyle extends HairstyleOption {
  image?: string;
  loading?: boolean;
  error?: boolean;
}

interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export function VirtualTryOn() {
  const [step, setStep] = useState<'intro' | 'selection' | 'camera' | 'results'>('intro');
  const [captureMode, setCaptureMode] = useState<'photo' | 'upload' | 'monthly'>('photo');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [hairLength, setHairLength] = useState('any');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [styles, setStyles] = useState<GeneratedStyle[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<GeneratedStyle | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const setupCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setVideoStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Camera access error:', error);
      toast({
        title: "Camera Error",
        description: "Please allow camera access to use this feature",
        variant: "destructive"
      });
      setStep('intro');
    }
  }, [toast]);

  const stopCamera = useCallback(() => {
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
      setVideoStream(null);
    }
  }, [videoStream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL('image/png');
      setCapturedImage(imageData);
      stopCamera();
      setStep('results');
      generateStyles(imageData);
    }
  }, [stopCamera]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      setCapturedImage(imageData);
      setStep('results');
      generateStyles(imageData);
    };
    reader.readAsDataURL(file);
  }, []);

  const generateStyles = async (imageData: string) => {
    setIsGenerating(true);
    try {
      // First, get the style list
      const response = await apiRequest('POST', '/api/virtual-tryon/styles', { gender, hairLength });
      const { styles: styleList } = await response.json();

      // Initialize styles with loading state
      const initialStyles: GeneratedStyle[] = styleList.map((style: HairstyleOption) => ({
        ...style,
        loading: true,
        error: false
      }));
      setStyles(initialStyles);

      // Generate images for each style
      for (let i = 0; i < styleList.length; i++) {
        try {
          const imageResponse = await apiRequest('POST', '/api/virtual-tryon/generate', {
            image: imageData,
            styleName: styleList[i].style_name
          });
          const { image } = await imageResponse.json();

          setStyles(prev => prev.map((s, idx) => 
            idx === i ? { ...s, image, loading: false } : s
          ));
        } catch (error) {
          console.error(`Failed to generate style ${styleList[i].style_name}:`, error);
          setStyles(prev => prev.map((s, idx) => 
            idx === i ? { ...s, error: true, loading: false } : s
          ));
        }
      }
    } catch (error) {
      console.error('Error generating styles:', error);
      toast({
        title: "Generation Error",
        description: "Failed to generate styles. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const openChat = (style: GeneratedStyle) => {
    setSelectedStyle(style);
    setChatMessages([{
      role: 'model',
      parts: [{ text: `Hello! I'm your AI stylist. I can give you advice on the "${style.style_name}" look. What would you like to know?` }]
    }]);
    setChatOpen(true);
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || !selectedStyle) return;

    const userMessage: ChatMessage = {
      role: 'user',
      parts: [{ text: chatInput }]
    };

    const updatedMessages = [...chatMessages, userMessage];
    setChatMessages(updatedMessages);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const response = await apiRequest('POST', '/api/virtual-tryon/chat', {
        messages: updatedMessages,
        styleName: selectedStyle.style_name
      });
      const { reply } = await response.json();

      setChatMessages([...updatedMessages, {
        role: 'model',
        parts: [{ text: reply }]
      }]);
    } catch (error) {
      toast({
        title: "Chat Error",
        description: "Failed to get response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsChatLoading(false);
    }
  };

  const startOver = () => {
    setStep('intro');
    setCapturedImage(null);
    setStyles([]);
    stopCamera();
  };

  useEffect(() => {
    if (step === 'camera' && captureMode === 'monthly') {
      setTimeout(() => {
        capturePhoto();
      }, 3000);
    }
  }, [step, captureMode, capturePhoto]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <div className="w-full">
      {/* Intro Step */}
      {step === 'intro' && (
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold">AI Virtual Try-On</h2>
            <p className="text-gray-600">See how different hairstyles look on you before visiting the salon</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              className="w-full sm:w-auto"
              onClick={() => {
                setCaptureMode('photo');
                setStep('selection');
              }}
              data-testid="button-take-photo"
            >
              <Camera className="mr-2 h-5 w-5" />
              Take Photo
            </Button>
            
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => {
                setCaptureMode('upload');
                setStep('selection');
              }}
              data-testid="button-upload-photo"
            >
              <Upload className="mr-2 h-5 w-5" />
              Upload Photo
            </Button>
            
            <Button
              size="lg"
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={() => {
                setCaptureMode('monthly');
                setStep('selection');
              }}
              data-testid="button-best-look"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Best Look This Month
            </Button>
          </div>
        </div>
      )}

      {/* Selection Step */}
      {step === 'selection' && (
        <Card>
          <CardHeader>
            <CardTitle>Tell Us About Your Style</CardTitle>
            <CardDescription>Help us suggest the perfect hairstyles for you</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">I am a:</label>
                <Select value={gender} onValueChange={(v) => setGender(v as 'male' | 'female')}>
                  <SelectTrigger data-testid="select-gender">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Man</SelectItem>
                    <SelectItem value="female">Woman</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">My hair is:</label>
                <Select value={hairLength} onValueChange={setHairLength}>
                  <SelectTrigger data-testid="select-hair-length">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Length</SelectItem>
                    <SelectItem value="short">Short</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="long">Long</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('intro')} data-testid="button-back">
                Back
              </Button>
              <Button
                className="flex-1"
                onClick={async () => {
                  if (captureMode === 'upload') {
                    fileInputRef.current?.click();
                  } else {
                    setStep('camera');
                    await setupCamera();
                  }
                }}
                data-testid="button-start-styling"
              >
                Start Styling
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Camera Step */}
      {step === 'camera' && (
        <div className="space-y-4">
          <div className="relative rounded-xl overflow-hidden border-2 border-gray-200 max-w-2xl mx-auto">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full"
              data-testid="video-camera"
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>
          
          {captureMode !== 'monthly' && (
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => { stopCamera(); setStep('selection'); }}>
                Cancel
              </Button>
              <Button onClick={capturePhoto} data-testid="button-capture">
                <Camera className="mr-2 h-4 w-4" />
                Capture
              </Button>
            </div>
          )}
          
          {captureMode === 'monthly' && (
            <p className="text-center text-gray-600">Capturing your look in 3 seconds...</p>
          )}
        </div>
      )}

      {/* Results Step */}
      {step === 'results' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Your New Looks</h2>
            <Button variant="outline" onClick={startOver} data-testid="button-start-over">
              Start Over
            </Button>
          </div>
          
          {isGenerating && styles.length === 0 && (
            <div className="text-center py-12">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-purple-600 mb-4" />
              <p className="text-gray-600">Generating your personalized looks...</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {styles.map((style, idx) => (
              <Card key={idx} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-gray-100 relative">
                  {style.loading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                    </div>
                  )}
                  {style.error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 p-4 text-center">
                      <X className="h-12 w-12 mb-2" />
                      <p className="text-sm">Failed to generate</p>
                    </div>
                  )}
                  {style.image && (
                    <img
                      src={`data:image/png;base64,${style.image}`}
                      alt={style.style_name}
                      className="w-full h-full object-cover"
                      data-testid={`image-style-${idx}`}
                    />
                  )}
                </div>
                <CardContent className="p-4 space-y-2">
                  <h3 className="font-bold text-lg line-clamp-1">{style.style_name}</h3>
                  <Badge className="bg-purple-100 text-purple-800">{style.tag}</Badge>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    Services: {style.services_needed}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => openChat(style)}
                    disabled={!style.image}
                    data-testid={`button-ask-stylist-${idx}`}
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Ask AI Stylist
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
        data-testid="input-file-upload"
      />

      {/* Chat Dialog */}
      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>AI Stylist Advice: {selectedStyle?.style_name}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="h-80 overflow-y-auto space-y-3 p-4 bg-gray-50 rounded-lg">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      msg.role === 'user'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-200 text-gray-900'
                    }`}
                  >
                    {msg.parts[0].text}
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-200 rounded-2xl px-4 py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                placeholder="Ask about this style..."
                disabled={isChatLoading}
                data-testid="input-chat"
              />
              <Button
                onClick={sendChatMessage}
                disabled={isChatLoading || !chatInput.trim()}
                data-testid="button-send-chat"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
