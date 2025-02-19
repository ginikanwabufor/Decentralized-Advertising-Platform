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
let lastPublisherId = 0
const publishers = new Map()

// Mock contract calls
const contractCalls = {
  "register-publisher": (website: string, adSpaces: string[]) => {
    const publisherId = ++lastPublisherId
    publishers.set(publisherId, {
      owner: mockClarity.types.principal(mockClarity.tx.sender),
      website: mockClarity.types.string(website),
      "ad-spaces": mockClarity.types.list(adSpaces.map((s) => mockClarity.types.string(s))),
      earnings: mockClarity.types.uint(0),
    })
    return { success: true, value: mockClarity.types.uint(publisherId) }
  },
  "update-ad-spaces": (publisherId: number, newAdSpaces: string[]) => {
    const publisher = publishers.get(publisherId)
    if (!publisher || publisher.owner.value !== mockClarity.tx.sender) {
      return { success: false, error: "err-owner-only" }
    }
    publisher["ad-spaces"] = mockClarity.types.list(newAdSpaces.map((s) => mockClarity.types.string(s)))
    return { success: true, value: true }
  },
  "record-earnings": (publisherId: number, amount: number) => {
    const publisher = publishers.get(publisherId)
    if (!publisher) {
      return { success: false, error: "err-not-found" }
    }
    publisher.earnings = mockClarity.types.uint(publisher.earnings.value + amount)
    return { success: true, value: true }
  },
  "get-publisher": (publisherId: number) => {
    const publisher = publishers.get(publisherId)
    return publisher ? { success: true, value: publisher } : { success: false, error: "err-not-found" }
  },
}

describe("Publisher Contract", () => {
  beforeEach(() => {
    lastPublisherId = 0
    publishers.clear()
  })
  
  it("should register a new publisher", () => {
    const result = contractCalls["register-publisher"]("https://example.com", ["header", "sidebar"])
    expect(result.success).toBe(true)
    expect(result.value).toEqual(mockClarity.types.uint(1))
    
    const publisher = publishers.get(1)
    expect(publisher).toBeDefined()
    expect(publisher.website).toEqual(mockClarity.types.string("https://example.com"))
    expect(publisher["ad-spaces"]).toEqual(
        mockClarity.types.list([mockClarity.types.string("header"), mockClarity.types.string("sidebar")]),
    )
    expect(publisher.earnings).toEqual(mockClarity.types.uint(0))
  })
  
  it("should update publisher ad spaces", () => {
    contractCalls["register-publisher"]("https://example.com", ["header", "sidebar"])
    const result = contractCalls["update-ad-spaces"](1, ["header", "sidebar", "footer"])
    expect(result.success).toBe(true)
    expect(result.value).toBe(true)
    
    const publisher = publishers.get(1)
    expect(publisher["ad-spaces"]).toEqual(
        mockClarity.types.list([
          mockClarity.types.string("header"),
          mockClarity.types.string("sidebar"),
          mockClarity.types.string("footer"),
        ]),
    )
  })
  
  it("should fail to update ad spaces if not owner", () => {
    contractCalls["register-publisher"]("https://example.com", ["header", "sidebar"])
    mockClarity.tx.sender = "ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
    const result = contractCalls["update-ad-spaces"](1, ["header"])
    expect(result.success).toBe(false)
    expect(result.error).toBe("err-owner-only")
  })
  
  it("should record publisher earnings", () => {
    contractCalls["register-publisher"]("https://example.com", ["header", "sidebar"])
    const result = contractCalls["record-earnings"](1, 100)
    expect(result.success).toBe(true)
    expect(result.value).toBe(true)
    
    const publisher = publishers.get(1)
    expect(publisher.earnings).toEqual(mockClarity.types.uint(100))
  })
  
  it("should accumulate publisher earnings", () => {
    contractCalls["register-publisher"]("https://example.com", ["header", "sidebar"])
    contractCalls["record-earnings"](1, 100)
    contractCalls["record-earnings"](1, 150)
    const publisher = publishers.get(1)
    expect(publisher.earnings).toEqual(mockClarity.types.uint(250))
  })
  
  it("should fail to get non-existent publisher", () => {
    const result = contractCalls["get-publisher"](999)
    expect(result.success).toBe(false)
    expect(result.error).toBe("err-not-found")
  })
})

