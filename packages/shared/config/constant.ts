export const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']
export const videoExts = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv']
export const audioExts = ['.mp3', '.wav', '.ogg', '.flac', '.aac']
export const documentExts = ['.pdf', '.docx', '.pptx', '.xlsx', '.odt', '.odp', '.ods']
export const thirdPartyApplicationExts = ['.draftsExport']
export const bookExts = ['.epub']
export const textExts = [
  '.txt', // Plain text file
  '.md', // Markdown file
  '.mdx', // Markdown file
  '.html', // HTML file
  '.htm', // Another extension for HTML file
  '.xml', // XML file
  '.json', // JSON file
  '.yaml', // YAML file
  '.yml', // Another extension for YAML file
  '.csv', // Comma-separated values file
  '.tsv', // Tab-separated values file
  '.ini', // Configuration file
  '.log', // Log file
  '.rtf', // Rich text format file
  '.org', // org-mode file
  '.wiki', // VimWiki file
  '.tex', // LaTeX file
  '.bib', // BibTeX file
  '.srt', // Subtitle file
  '.xhtml', // XHTML file
  '.nfo', // Information file (mainly used for scene releases)
  '.conf', // Configuration file
  '.config', // Configuration file
  '.env', // Environment variables file
  '.rst', // reStructuredText file
  '.php', // PHP script file, contains embedded HTML
  '.js', // JavaScript file (partly text, partly may contain code)
  '.ts', // TypeScript file
  '.jsp', // JavaServer Pages file
  '.aspx', // ASP.NET file
  '.bat', // Windows batch file
  '.sh', // Unix/Linux Shell script file
  '.py', // Python script file
  '.ipynb', // Jupyter notebook format
  '.rb', // Ruby script file
  '.pl', // Perl script file
  '.sql', // SQL script file
  '.css', // Cascading Style Sheets file
  '.less', // Less CSS preprocessor file
  '.scss', // Sass CSS preprocessor file
  '.sass', // Sass file
  '.styl', // Stylus CSS preprocessor file
  '.coffee', // CoffeeScript file
  '.ino', // Arduino code file
  '.asm', // Assembly language file
  '.go', // Go language file
  '.scala', // Scala language file
  '.swift', // Swift language file
  '.kt', // Kotlin language file
  '.rs', // Rust language file
  '.lua', // Lua language file
  '.groovy', // Groovy language file
  '.dart', // Dart language file
  '.hs', // Haskell language file
  '.clj', // Clojure language file
  '.cljs', // ClojureScript language file
  '.elm', // Elm language file
  '.erl', // Erlang language file
  '.ex', // Elixir language file
  '.exs', // Elixir script file
  '.pug', // Pug (formerly Jade) template file
  '.haml', // Haml template file
  '.slim', // Slim template file
  '.tpl', // Template file (generic)
  '.ejs', // Embedded JavaScript template file
  '.hbs', // Handlebars template file
  '.mustache', // Mustache template file
  '.jade', // Jade template file (renamed to Pug)
  '.twig', // Twig template file
  '.blade', // Blade template file (Laravel)
  '.vue', // Vue.js single file component
  '.jsx', // React JSX file
  '.tsx', // React TSX file
  '.graphql', // GraphQL query language file
  '.gql', // GraphQL query language file
  '.proto', // Protocol Buffers file
  '.thrift', // Thrift file
  '.toml', // TOML configuration file
  '.edn', // Clojure data representation file
  '.cake', // CakePHP configuration file
  '.ctp', // CakePHP view file
  '.cfm', // ColdFusion markup language file
  '.cfc', // ColdFusion component file
  '.m', // Objective-C or MATLAB source file
  '.mm', // Objective-C++ source file
  '.gradle', // Gradle build file
  '.groovy', // Gradle build file
  '.kts', // Kotlin Script file
  '.java', // Java code file
  '.cs', // C# code file
  '.cpp', // C++ code file
  '.c', // C code file
  '.h', // C/C++ header file
  '.hpp', // C++ header file
  '.cc', // C++ source file
  '.cxx', // C++ source file
  '.cppm', // C++20 module interface file
  '.ipp', // Template implementation file
  '.ixx', // C++20 module implementation file
  '.f90', // Fortran 90 source file
  '.f', // Fortran fixed format source code file
  '.f03', // Fortran 2003+ source code file
  '.ahk', // AutoHotKey language file
  '.tcl', // Tcl script
  '.do', // Questa or Modelsim Tcl script
  '.v', // Verilog source file
  '.sv', // SystemVerilog source file
  '.svh', // SystemVerilog header file
  '.vhd', // VHDL source file
  '.vhdl', // VHDL source file
  '.lef', // Library Exchange Format
  '.def', // Design Exchange Format
  '.edif', // Electronic Design Interchange Format
  '.sdf', // Standard Delay Format
  '.sdc', // Synopsys Design Constraints
  '.xdc', // Xilinx Design Constraints
  '.rpt', // Report file
  '.lisp', // Lisp script
  '.il', // Cadence SKILL script
  '.ils', // Cadence SKILL++ script
  '.sp', // SPICE netlist file
  '.spi', // SPICE netlist file
  '.cir', // SPICE netlist file
  '.net', // SPICE netlist file
  '.scs', // Spectre netlist file
  '.asc', // LTspice netlist schematic file
  '.tf' // Technology File
]

export const ZOOM_LEVELS = [0.25, 0.33, 0.5, 0.67, 0.75, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4, 5]

// Generate options structure needed for Ant Design Select from ZOOM_LEVELS
export const ZOOM_OPTIONS = ZOOM_LEVELS.map((level) => ({
  value: level,
  label: `${Math.round(level * 100)}%`
}))

export const ZOOM_SHORTCUTS = [
  {
    key: 'zoom_in',
    shortcut: ['CommandOrControl', '='],
    editable: false,
    enabled: true,
    system: true
  },
  {
    key: 'zoom_out',
    shortcut: ['CommandOrControl', '-'],
    editable: false,
    enabled: true,
    system: true
  },
  {
    key: 'zoom_reset',
    shortcut: ['CommandOrControl', '0'],
    editable: false,
    enabled: true,
    system: true
  }
]

export const KB = 1024
export const MB = 1024 * KB
export const GB = 1024 * MB
export const defaultLanguage = 'en-US'
