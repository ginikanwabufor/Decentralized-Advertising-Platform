import { describe, it, expect, beforeEach } from "vitest"

// Mock the Clarity functions and types
const mockClarity = {
  tx: {
    sender: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
  },
  types: {
    uint: (value: number) => ({ type: "uint", value }),
    principal: (value: string) => ({ type: "principal", value }),
    string: (value: string) => ({ type: "string", value }),
    list: (value: any[]) => ({ type: "list", value }),
  },
}

// Mock contract state
let lastAdId = 0
const ads = new Map()

// Mock contract calls
const contractCalls = {
  "create-ad": (contentUrl: string, targetDemographics: string[], budget: number) => {
    const adId = ++lastAdId
    ads.set(adId, {
      advertiser: mockClarity.types.principal(mockClarity.tx.sender),
      "content-url": mockClarity.types.string(contentUrl),
      "target-demographics": mockClarity.types.list(targetDemographics.map((d) => mockClarity.types.string(d))),
      budget: mockClarity.types.uint(budget),
      status: mockClarity.types.string("active"),
    })
    return { success: true, value: mockClarity.types.uint(adId) }
  },
  "update-ad-status": (adId: number, newStatus: string) => {
    const ad = ads.get(adId)
    if (!ad || ad.advertiser.value !== mockClarity.tx.sender) {
      return { success: false, error: "err-owner-only" }
    }
    ad.status = mockClarity.types.string(newStatus)
    return { success: true, value: true }
  },
  "update-ad-budget": (adId: number, newBudget: number) => {
    const ad = ads.get(adId)
    if (!ad || ad.advertiser.value !== mockClarity.tx.sender) {
      return { success: false, error: "err-owner-only" }
    }
    ad.budget = mockClarity.types.uint(newBudget)
    return { success: true, value: true }
  },
  "get-ad": (adId: number) => {
    const ad = ads.get(adId)
    return ad ? { success: true, value: ad } : { success: false, error: "err-not-found" }
  },
}

describe("Ad Contract", () => {
  beforeEach(() => {
    lastAdId = 0
    ads.clear()
  })
  
  it("should create a new ad campaign", () => {
    const result = contractCalls["create-ad"]("https://example.com/ad1", ["male", "18-35"], 1000)
    expect(result.success).toBe(true)
    expect(result.value).toEqual(mockClarity.types.uint(1))
    
    const ad = ads.get(1)
    expect(ad).toBeDefined()
    expect(ad["content-url"]).toEqual(mockClarity.types.string("https://example.com/ad1"))
    expect(ad["target-demographics"]).toEqual(
        mockClarity.types.list([mockClarity.types.string("male"), mockClarity.types.string("18-35")]),
    )
    expect(ad.budget).toEqual(mockClarity.types.uint(1000))
    expect(ad.status).toEqual(mockClarity.types.string("active"))
  })
  
  it("should update ad campaign status", () => {
    contractCalls["create-ad"]("https://example.com/ad2", ["female", "25-40"], 2000)
    const result = contractCalls["update-ad-status"](1, "paused")
    expect(result.success).toBe(true)
    expect(result.value).toBe(true)
    
    const ad = ads.get(1)
    expect(ad.status).toEqual(mockClarity.types.string("paused"))
  })
  
  it("should fail to update ad status if not owner", () => {
    contractCalls["create-ad"]("https://example.com/ad3", ["all"], 3000)
    mockClarity.tx.sender = "ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
    const result = contractCalls["update-ad-status"](1, "completed")
    expect(result.success).toBe(false)
    expect(result.error).toBe("err-owner-only")
  })
  
  it("should update ad campaign budget", () => {
    contractCalls["create-ad"]("https://example.com/ad4", ["male", "40-55"], 4000)
    const result = contractCalls["update-ad-budget"](1, 5000)
    expect(result.success).toBe(true)
    expect(result.value).toBe(true)
    
    const ad = ads.get(1)
    expect(ad.budget).toEqual(mockClarity.types.uint(5000))
  })
  
  it("should fail to update ad budget if not owner", () => {
    contractCalls["create-ad"]("https://example.com/ad5", ["female", "18-25"], 5000)
    mockClarity.tx.sender = "ST3PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
    const result = contractCalls["update-ad-budget"](1, 6000)
    expect(result.success).toBe(false)
    expect(result.error).toBe("err-owner-only")
  })
  
  it("should fail to get non-existent ad", () => {
    const result = contractCalls["get-ad"](999)
    expect(result.success).toBe(false)
    expect(result.error).toBe("err-not-found")
  })
})

