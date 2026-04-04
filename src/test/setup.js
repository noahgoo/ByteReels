import '@testing-library/jest-dom'

// jsdom doesn't implement IntersectionObserver — stub it globally
globalThis.IntersectionObserver = class IntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
