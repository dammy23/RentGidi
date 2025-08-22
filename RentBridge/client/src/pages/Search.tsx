import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Home,
  Search as SearchIcon,
  Filter,
  MapPin,
  DollarSign,
  Bed,
  Bath,
  Square,
  Eye,
  Heart,
  SlidersHorizontal
} from "lucide-react"
import { searchProperties } from "@/api/properties"
import { useToast } from "@/hooks/useToast"
import {SERVER_URL}  from '@/config/constants';

export function Search() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  
  // Initialize properties as empty array to prevent undefined errors
  const [properties, setProperties] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState(searchParams.get('location') || "")
  const [priceRange, setPriceRange] = useState([0, 10000000])
  const [bedrooms, setBedrooms] = useState<string>("all")
  const [bathrooms, setBathrooms] = useState<string>("all")
  const [propertyType, setPropertyType] = useState<string>("all")
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<string>("createdAt")
  const [sortOrder, setSortOrder] = useState<string>("desc")
  const [showFilters, setShowFilters] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  })

  console.log('Search: Component rendered')
  console.log('Search: Properties state:', properties)
  console.log('Search: Properties is array:', Array.isArray(properties))
  console.log('Search: Properties length:', properties?.length)

  const amenitiesList = [
    "parking",
    "security", 
    "generator",
    "wifi",
    "pool",
    "gym",
    "garden",
    "balcony"
  ]

  useEffect(() => {
    console.log('Search: useEffect triggered, performing initial search')
    performSearch()
  }, [])

  const performSearch = async (page = 1) => {
    try {
      console.log('Search: Performing search with params:', {
        location: searchTerm,
        minPrice: priceRange[0],
        maxPrice: priceRange[1],
        bedrooms: bedrooms !== "all" ? parseInt(bedrooms) : undefined,
        bathrooms: bathrooms !== "all" ? parseInt(bathrooms) : undefined,
        type: propertyType !== "all" ? propertyType : undefined,
        amenities: selectedAmenities.length > 0 ? selectedAmenities : undefined,
        sortBy,
        sortOrder,
        page,
        limit: pagination.limit
      })

      setLoading(true)
      
      const searchData = {
        location: searchTerm || undefined,
        minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
        maxPrice: priceRange[1] < 10000000 ? priceRange[1] : undefined,
        bedrooms: bedrooms !== "all" ? parseInt(bedrooms) : undefined,
        bathrooms: bathrooms !== "all" ? parseInt(bathrooms) : undefined,
        type: propertyType !== "all" ? propertyType : undefined,
        amenities: selectedAmenities.length > 0 ? selectedAmenities : undefined,
        sortBy,
        sortOrder,
        page,
        limit: pagination.limit
      }

      // Remove undefined values
      Object.keys(searchData).forEach(key => {
        if (searchData[key as keyof typeof searchData] === undefined) {
          delete searchData[key as keyof typeof searchData]
        }
      })

      console.log('Search: Final search data being sent to API:', searchData)
      console.log('Search: About to call searchProperties API')
      
      const response = await searchProperties(searchData)
      
      console.log('Search: Raw API response received:', response)
      console.log('Search: Response type:', typeof response)
      console.log('Search: Response keys:', response ? Object.keys(response) : 'null response')

      // Ensure we always set an array, even if the response is malformed
      const propertiesData = response?.data || response?.properties || []
      console.log('Search: Extracted properties data:', propertiesData)
      console.log('Search: Properties data type:', typeof propertiesData)
      console.log('Search: Properties data is array:', Array.isArray(propertiesData))
      console.log('Search: Properties data length:', Array.isArray(propertiesData) ? propertiesData.length : 'not an array')

      if (Array.isArray(propertiesData) && propertiesData.length > 0) {
        console.log('Search: First property sample:', propertiesData[0])
        console.log('Search: First property keys:', Object.keys(propertiesData[0]))
      }

      setProperties(Array.isArray(propertiesData) ? propertiesData : [])
      
      if (response?.pagination) {
        console.log('Search: Pagination data:', response.pagination)
        setPagination(response.pagination)
      } else {
        console.log('Search: No pagination data in response, creating default')
        setPagination({
          page: 1,
          limit: 12,
          total: Array.isArray(propertiesData) ? propertiesData.length : 0,
          pages: 1
        })
      }

      console.log('Search: Properties set successfully, final count:', Array.isArray(propertiesData) ? propertiesData.length : 0)
      console.log('Search: Final properties state will be:', Array.isArray(propertiesData) ? propertiesData : [])
      
    } catch (error: any) {
      console.error('Search: Error searching properties:', error)
      console.error('Search: Error type:', typeof error)
      console.error('Search: Error message:', error.message)
      console.error('Search: Error stack:', error.stack)
      console.error('Search: Full error object:', error)
      
      toast({
        variant: "destructive",
        title: "Search Error",
        description: error.message || "Failed to search properties"
      })
      // Set empty array on error to prevent undefined issues
      setProperties([])
      setPagination({
        page: 1,
        limit: 12,
        total: 0,
        pages: 0
      })
    } finally {
      setLoading(false)
      console.log('Search: performSearch completed, loading set to false')
    }
  }

  const handleSearch = () => {
    console.log('Search: Handle search triggered')
    performSearch(1)
  }

  const handlePageChange = (newPage: number) => {
    console.log('Search: Page change to:', newPage)
    performSearch(newPage)
  }

  const handleAmenityChange = (amenity: string, checked: boolean) => {
    console.log('Search: Amenity change:', amenity, checked)
    if (checked) {
      setSelectedAmenities([...selectedAmenities, amenity])
    } else {
      setSelectedAmenities(selectedAmenities.filter(a => a !== amenity))
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(price)
  }

  console.log('Search: Before render - properties:', properties)
  console.log('Search: Before render - properties length:', properties?.length)

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-8 rounded-lg">
        <h1 className="text-3xl font-bold mb-4">Find Your Perfect Home</h1>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Enter location (city, area, or address)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white text-gray-900"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
          </div>
          <Button onClick={handleSearch} className="bg-white text-blue-600 hover:bg-gray-100">
            <SearchIcon className="h-4 w-4 mr-2" />
            Search
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="bg-transparent border-white text-white hover:bg-white hover:text-blue-600"
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Advanced Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Price Range */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Price Range: {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
              </label>
              <Slider
                value={priceRange}
                onValueChange={setPriceRange}
                max={10000000}
                min={0}
                step={100000}
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Bedrooms */}
              <div>
                <label className="text-sm font-medium mb-2 block">Bedrooms</label>
                <Select value={bedrooms} onValueChange={setBedrooms}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any</SelectItem>
                    <SelectItem value="1">1+</SelectItem>
                    <SelectItem value="2">2+</SelectItem>
                    <SelectItem value="3">3+</SelectItem>
                    <SelectItem value="4">4+</SelectItem>
                    <SelectItem value="5">5+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Bathrooms */}
              <div>
                <label className="text-sm font-medium mb-2 block">Bathrooms</label>
                <Select value={bathrooms} onValueChange={setBathrooms}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any</SelectItem>
                    <SelectItem value="1">1+</SelectItem>
                    <SelectItem value="2">2+</SelectItem>
                    <SelectItem value="3">3+</SelectItem>
                    <SelectItem value="4">4+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Property Type */}
              <div>
                <label className="text-sm font-medium mb-2 block">Property Type</label>
                <Select value={propertyType} onValueChange={setPropertyType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="house">House</SelectItem>
                    <SelectItem value="condo">Condo</SelectItem>
                    <SelectItem value="studio">Studio</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort By */}
              <div>
                <label className="text-sm font-medium mb-2 block">Sort By</label>
                <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                  const [field, order] = value.split('-')
                  setSortBy(field)
                  setSortOrder(order)
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt-desc">Newest First</SelectItem>
                    <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                    <SelectItem value="price-asc">Price: Low to High</SelectItem>
                    <SelectItem value="price-desc">Price: High to Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Amenities */}
            <div>
              <label className="text-sm font-medium mb-2 block">Amenities</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {amenitiesList.map((amenity) => (
                  <div key={amenity} className="flex items-center space-x-2">
                    <Checkbox
                      id={amenity}
                      checked={selectedAmenities.includes(amenity)}
                      onCheckedChange={(checked) => handleAmenityChange(amenity, checked as boolean)}
                    />
                    <label htmlFor={amenity} className="text-sm capitalize cursor-pointer">
                      {amenity}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={handleSearch} className="w-full">
              Apply Filters
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          {loading ? "Searching..." : `${pagination.total} Properties Found`}
        </h2>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Safe check for properties length */}
          {properties && properties.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Home className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Properties Found</h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your search criteria or browse all available properties.
                </p>
                <Button onClick={() => {
                  setSearchTerm("")
                  setPriceRange([0, 10000000])
                  setBedrooms("all")
                  setBathrooms("all")
                  setPropertyType("all")
                  setSelectedAmenities([])
                  handleSearch()
                }}>
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Safe iteration over properties */}
              {(properties || []).map((property) => (
                <Card key={property._id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="relative h-48 bg-gray-200">
                    {property.images && property.images.length > 0 ? (
                      <img
                        src={`${SERVER_URL}${property.images[0]}`}
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Home className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
                        <Heart className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="absolute bottom-2 left-2">
                      <Badge variant="secondary">{property.status}</Badge>
                    </div>
                  </div>
                  
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-1">{property.title}</h3>
                    <p className="text-2xl font-bold text-blue-600 mb-2">
                      {formatPrice(property.price)}/month
                    </p>
                    <p className="flex items-center text-gray-600 mb-3">
                      <MapPin className="h-4 w-4 mr-1" />
                      {property.location}
                    </p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                      {property.bedrooms && (
                        <div className="flex items-center gap-1">
                          <Bed className="h-4 w-4" />
                          <span>{property.bedrooms} bed</span>
                        </div>
                      )}
                      {property.bathrooms && (
                        <div className="flex items-center gap-1">
                          <Bath className="h-4 w-4" />
                          <span>{property.bathrooms} bath</span>
                        </div>
                      )}
                      {property.squareFootage && (
                        <div className="flex items-center gap-1">
                          <Square className="h-4 w-4" />
                          <span>{property.squareFootage} sqft</span>
                        </div>
                      )}
                    </div>

                    <Button 
                      className="w-full"
                      onClick={() => {
                        console.log('Search: View Details clicked for property:', property);
                        console.log('Search: Property ID:', property._id);
                        console.log('Search: Property ID type:', typeof property._id);
                        console.log('Search: Property ID exists:', !!property._id);
                        
                        if (!property._id) {
                          console.error('Search: Property ID is missing or invalid');
                          toast({
                            variant: "destructive",
                            title: "Error",
                            description: "Property ID is missing. Cannot view details."
                          });
                          return;
                        }
                        
                        try {
                          console.log('Search: Navigating to:', `/properties/${property._id}`);
                          navigate(`/properties/${property._id}`);
                        } catch (error) {
                          console.error('Search: Navigation error:', error);
                          toast({
                            variant: "destructive",
                            title: "Navigation Error",
                            description: "Failed to navigate to property details."
                          });
                        }
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {properties && properties.length > 0 && pagination.pages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <Button
                variant="outline"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                Previous
              </Button>
              
              <div className="flex gap-1">
                {[...Array(Math.min(pagination.pages, 5))].map((_, i) => {
                  const pageNum = i + 1
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === pagination.page ? "default" : "outline"}
                      onClick={() => handlePageChange(pageNum)}
                      className="w-10"
                    >
                      {pageNum}
                    </Button>
                  )
                })}
              </div>

              <Button
                variant="outline"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}