#!/usr/bin/env python
"""
Run integration tests for the trading agent system.

This script runs all integration tests and generates a report.
"""
import os
import sys
import time
import argparse
import subprocess
import json
from datetime import datetime

# Define test categories
TEST_CATEGORIES = {
    "system": ["test_system_flow.py"],
    "performance": ["test_performance.py"],
    "monitoring": ["test_monitoring.py"],
    "all": ["test_system_flow.py", "test_performance.py", "test_monitoring.py"]
}

def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description="Run integration tests")
    parser.add_argument(
        "--category",
        choices=TEST_CATEGORIES.keys(),
        default="all",
        help="Test category to run"
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Enable verbose output"
    )
    parser.add_argument(
        "--report",
        action="store_true",
        help="Generate HTML report"
    )
    parser.add_argument(
        "--distributed",
        action="store_true",
        help="Enable distributed cache tests (requires Redis)"
    )
    return parser.parse_args()

def run_tests(category, verbose=False, distributed=False):
    """Run tests for the specified category."""
    # Get test files
    test_files = TEST_CATEGORIES.get(category, [])
    if not test_files:
        print(f"No tests found for category: {category}")
        return False
    
    # Build command
    cmd = ["pytest"]
    
    # Add test files
    for test_file in test_files:
        test_path = os.path.join("trading_agents", "tests", "integration", test_file)
        cmd.append(test_path)
    
    # Add options
    if verbose:
        cmd.append("-v")
    
    # Add JUnit XML output for reporting
    report_dir = os.path.join("trading_agents", "tests", "reports")
    os.makedirs(report_dir, exist_ok=True)
    report_file = os.path.join(report_dir, f"integration_{category}.xml")
    cmd.extend(["--junitxml", report_file])
    
    # Add environment variables
    env = os.environ.copy()
    if distributed:
        env["TEST_DISTRIBUTED_CACHE"] = "true"
    
    # Run tests
    print(f"Running {category} tests...")
    print(f"Command: {' '.join(cmd)}")
    
    start_time = time.time()
    result = subprocess.run(cmd, env=env)
    end_time = time.time()
    
    # Print results
    duration = end_time - start_time
    success = result.returncode == 0
    
    print(f"\n{'=' * 80}")
    print(f"Test Results for {category}:")
    print(f"{'=' * 80}")
    print(f"Status: {'SUCCESS' if success else 'FAILURE'}")
    print(f"Duration: {duration:.2f} seconds")
    print(f"Return code: {result.returncode}")
    print(f"{'=' * 80}\n")
    
    return success

def generate_report(categories):
    """Generate HTML report from JUnit XML files."""
    report_dir = os.path.join("trading_agents", "tests", "reports")
    output_file = os.path.join(report_dir, "integration_report.html")
    
    # Check if junit2html is installed
    try:
        import junit2html
    except ImportError:
        print("junit2html not installed. Installing...")
        subprocess.run([sys.executable, "-m", "pip", "install", "junit2html"])
    
    # Generate report for each category
    for category in categories:
        xml_file = os.path.join(report_dir, f"integration_{category}.xml")
        html_file = os.path.join(report_dir, f"integration_{category}.html")
        
        if os.path.exists(xml_file):
            cmd = ["junit2html", xml_file, html_file]
            subprocess.run(cmd)
    
    # Create index.html
    with open(os.path.join(report_dir, "index.html"), "w") as f:
        f.write("""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Integration Test Report</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { color: #333; }
                table { border-collapse: collapse; width: 100%; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                tr:nth-child(even) { background-color: #f9f9f9; }
                .success { color: green; }
                .failure { color: red; }
            </style>
        </head>
        <body>
            <h1>Integration Test Report</h1>
            <p>Generated on: %s</p>
            <table>
                <tr>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Report</th>
                </tr>
        """ % datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
        
        for category in categories:
            xml_file = os.path.join(report_dir, f"integration_{category}.xml")
            html_file = f"integration_{category}.html"
            
            if os.path.exists(xml_file):
                # Parse XML to get status
                import xml.etree.ElementTree as ET
                tree = ET.parse(xml_file)
                root = tree.getroot()
                failures = int(root.attrib.get("failures", "0"))
                errors = int(root.attrib.get("errors", "0"))
                status = "success" if failures == 0 and errors == 0 else "failure"
                
                f.write(f"""
                <tr>
                    <td>{category}</td>
                    <td class="{status}">{"SUCCESS" if status == "success" else "FAILURE"}</td>
                    <td><a href="{html_file}">View Report</a></td>
                </tr>
                """)
        
        f.write("""
            </table>
        </body>
        </html>
        """)
    
    print(f"Report generated: {os.path.join(report_dir, 'index.html')}")

def main():
    """Main function."""
    args = parse_args()
    
    if args.category == "all":
        # Run all categories
        results = {}
        for category in [c for c in TEST_CATEGORIES.keys() if c != "all"]:
            results[category] = run_tests(category, args.verbose, args.distributed)
        
        # Print summary
        print("\nTest Summary:")
        for category, success in results.items():
            print(f"{category}: {'SUCCESS' if success else 'FAILURE'}")
        
        # Generate report
        if args.report:
            generate_report([c for c in TEST_CATEGORIES.keys() if c != "all"])
        
        # Return success only if all tests passed
        return all(results.values())
    else:
        # Run specific category
        success = run_tests(args.category, args.verbose, args.distributed)
        
        # Generate report
        if args.report:
            generate_report([args.category])
        
        return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
