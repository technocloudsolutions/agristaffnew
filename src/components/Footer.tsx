const Footer = () => {
  return (
    <footer className="bg-card border-t border-border transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground text-center md:text-left">
            <div className="font-medium">
              © {new Date().getFullYear()} Department of Agriculture, Sri Lanka.
            </div>
            <div className="mt-1 text-xs opacity-90">
              Developed by Television and Farm Broadcasting Service
            </div>
          </div>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a 
              href="/privacy" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              Privacy Policy
            </a>
            <a 
              href="/terms" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              Terms of Service
            </a>
            <a 
              href="/contact" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 