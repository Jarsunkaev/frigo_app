import { auth, googleProvider } from "../../pages/api/firebase"
import { jest } from '@jest/globals'

jest.mock("../../pages/api/firebase", () => ({
  auth: {
    signInWithPopup: jest.fn(),
    signOut: jest.fn()
  },
  googleProvider: {}
}))

describe('Auth Utils', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  test('auth object is defined', () => {
    expect(auth).toBeDefined()
  })

  test('googleProvider object is defined', () => {
    expect(googleProvider).toBeDefined()
  })

  test('auth.signInWithPopup is called with googleProvider', async () => {
    await auth.signInWithPopup(googleProvider)
    expect(auth.signInWithPopup).toHaveBeenCalledWith(googleProvider)
  })

  test('auth.signOut is called', async () => {
    await auth.signOut()
    expect(auth.signOut).toHaveBeenCalled()
  })
})
