import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { detectRecipe, extractRecipe, convertToMarkdown } from './api/recipeApi'
import { Button } from './components/ui/button'
import { Input } from './components/ui/input'
import { useToast } from './components/ui/use-toast'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './components/ui/card'
import { Progress } from './components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { RecipeView } from './components/RecipeView'
import { ClipLoader } from './components/ClipLoader'
import { Icons } from './components/Icons'

function App() {
  const [url, setUrl] = useState('')
  const [activeTab, setActiveTab] = useState('url')
  const [currentStep, setCurrentStep] = useState(0)
  const [recipeData, setRecipeData] = useState(null)
  const [markdownContent, setMarkdownContent] = useState(null)
  const { toast } = useToast()

  // Get current tab URL when extension is opened
  useEffect(() => {
    if (chrome?.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.url) {
          setUrl(tabs[0].url)
        }
      })
    }
  }, [])

  // Detection mutation
  const detectMutation = useMutation({
    mutationFn: detectRecipe,
    onSuccess: (data) => {
      if (data.hasRecipe) {
        toast({
          title: "Recipe Detected!",
          description: `Found a ${data.recipeType} recipe with ${Math.round(data.confidence * 100)}% confidence.`,
          variant: "success",
        })
        setCurrentStep(1)
        extractMutation.mutate({ url })
      } else {
        toast({
          title: "No Recipe Found",
          description: "We couldn't detect a recipe on this page.",
          variant: "destructive",
        })
        setCurrentStep(0)
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to detect recipe.",
        variant: "destructive",
      })
      setCurrentStep(0)
    }
  })

  // Extraction mutation
  const extractMutation = useMutation({
    mutationFn: extractRecipe,
    onSuccess: (data) => {
      setRecipeData(data.recipe)
      setCurrentStep(2)
      convertMutation.mutate({ recipe: data.recipe })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to extract recipe.",
        variant: "destructive",
      })
      setCurrentStep(0)
    }
  })

  // Markdown conversion mutation
  const convertMutation = useMutation({
    mutationFn: convertToMarkdown,
    onSuccess: (data) => {
      setMarkdownContent(data)
      setCurrentStep(3)
      toast({
        title: "Recipe Ready!",
        description: "Your recipe has been successfully processed.",
      })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to convert recipe to markdown.",
        variant: "destructive",
      })
    }
  })

  // Download the markdown file
  const handleDownload = () => {
    if (!markdownContent) return
    
    const blob = new Blob([markdownContent.markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    
    // Use Chrome Download API if available
    if (chrome?.downloads) {
      chrome.downloads.download({
        url: url,
        filename: markdownContent.fileName,
        saveAs: true
      })
    } else {
      // Fallback for development environment
      const a = document.createElement('a')
      a.href = url
      a.download = markdownContent.fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
    
    URL.revokeObjectURL(url)
  }

  // Handle recipe detection
  const handleDetectRecipe = () => {
    if (!url) {
      toast({
        title: "URL Required",
        description: "Please enter a valid URL to detect recipes.",
        variant: "destructive",
      })
      return
    }
    
    setCurrentStep(0.5)
    setRecipeData(null)
    setMarkdownContent(null)
    detectMutation.mutate({ url })
  }

  // Determine if a mutation is in progress
  const isLoading = 
    detectMutation.isPending || 
    extractMutation.isPending || 
    convertMutation.isPending

  // Get progress percentage based on current step
  const getProgressPercentage = () => {
    return Math.min(currentStep / 3 * 100, 100)
  }

  return (
    <div className="container p-4">
      <div className="flex items-center mb-6">
        <Icons.utensils className="h-6 w-6 mr-2 text-primary" />
        <h1 className="text-2xl font-bold">Mealman</h1>
      </div>
      
      <Tabs defaultValue="url" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="url" disabled={isLoading && currentStep > 0}>URL</TabsTrigger>
          <TabsTrigger value="recipe" disabled={!recipeData}>Recipe</TabsTrigger>
        </TabsList>
        
        <TabsContent value="url" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Recipe Detector</CardTitle>
              <CardDescription>
                Enter a URL or use the current page to detect and extract recipes.
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="flex space-x-2">
                <Input 
                  placeholder="https://example.com/recipe" 
                  value={url} 
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={isLoading && currentStep > 0}
                />
                <Button onClick={handleDetectRecipe} disabled={isLoading}>
                  {isLoading ? <ClipLoader size={16} /> : "Detect"}
                </Button>
              </div>
              
              {currentStep > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{Math.round(getProgressPercentage())}%</span>
                  </div>
                  <Progress value={getProgressPercentage()} />
                  
                  <div className="text-sm text-muted-foreground">
                    {currentStep === 0.5 && "Detecting recipe..."}
                    {currentStep === 1 && "Extracting recipe details..."}
                    {currentStep === 2 && "Formatting recipe..."}
                    {currentStep === 3 && "Done! Recipe ready to download."}
                  </div>
                </div>
              )}
            </CardContent>
            
            {markdownContent && (
              <CardFooter>
                <Button onClick={handleDownload} className="w-full">
                  <Icons.download className="mr-2 h-4 w-4" />
                  Download Recipe
                </Button>
              </CardFooter>
            )}
          </Card>
        </TabsContent>
        
        <TabsContent value="recipe">
          {recipeData && <RecipeView recipe={recipeData} onDownload={handleDownload} />}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default App
