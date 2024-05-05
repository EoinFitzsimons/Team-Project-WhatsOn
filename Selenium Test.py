import time
from selenium import webdriver
from selenium.webdriver.edge.service import Service
from selenium.webdriver.edge.options import Options
from selenium.webdriver.common.alert import Alert

# Path to Edge WebDriver
webdriver_service = Service('C:\\Users\\eoin0\\Downloads\\edgedriver_win64\\msedgedriver.exe')

# Create EdgeOptions
options = Options()

# Create Edge WebDriver with options
driver = webdriver.Edge(service=webdriver_service, options=options)

# Navigate to a blank page
driver.get('about:blank')

# Navigate to the web application
driver.get('http://localhost:3000')

# Wait for the prompt to appear
driver.implicitly_wait(10)  # waits up to 10 seconds for the alert to appear

# Switch to the alert
alert = Alert(driver)

# Enter the API key into the prompt
alert.send_keys('9067dc23064fbdb794f79053211c2c4395c0d8bea8208194f8583ba42b8946d09acadcc4252e72bb')

# Accept the prompt
alert.accept()

# Wait for 10 seconds
time.sleep(10)

# Don't forget to quit the driver when you're done
driver.quit()
