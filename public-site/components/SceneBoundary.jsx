'use client';

import { Component } from 'react';

// Keeps a failing 3D scene from taking the whole page with it.
//
// This exists because of a real failure mode: the globe used to load its
// Earth texture from an external CDN, and when that request failed the
// thrown error propagated all the way up and React replaced the entire
// landing page with "Application error: a client-side exception has
// occurred". A marketing site should never go blank because a decorative
// canvas couldn't paint.
//
// WebGL being unavailable (old hardware, blocked in the browser, a
// headless crawler) produces the same class of error, so everything that
// renders a <Canvas> belongs inside one of these.
export default class SceneBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    // Worth seeing in the console, not worth surfacing to a visitor.
    console.warn('3D scene failed to render; showing fallback.', error);
  }

  render() {
    if (this.state.failed) return this.props.fallback ?? null;
    return this.props.children;
  }
}
