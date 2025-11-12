// backend/server.js
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// RentCast API Configuration
const RENTCAST_API_KEY = '62141be1cbce48f4a4cc8d30dd08eafb';
const RENTCAST_BASE_URL = 'https://api.rentcast.io/v1';

// Email Configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Verify email configuration on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('Email configuration error:', error);
  } else {
    console.log('✅ Email server is ready to send alerts');
  }
});

// Calculate mortgage payment
function calculateMortgage(principal, annualRate, years = 30) {
  const monthlyRate = annualRate / 100 / 12;
  const numPayments = years * 12;
  const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                  (Math.pow(1 + monthlyRate, numPayments) - 1);
  return payment;
}

// Analyze property for investment potential
function analyzeProperty(property, config) {
  const price = property.price || 0;
  const estimatedRent = property.rentEstimate || 0;
  
  // Calculate financing
  const downPayment = price * (config.downPaymentPercent / 100);
  const loanAmount = price - downPayment;
  const monthlyMortgage = calculateMortgage(loanAmount, config.interestRate);
  
  // Calculate monthly expenses
  const propertyTax = (price * (config.propertyTaxRate / 100)) / 12;
  const insurance = config.insuranceMonthly || 150;
  const maintenance = (price * (config.maintenancePercent / 100)) / 12;
  const propertyManagement = estimatedRent * (config.propertyManagementPercent / 100);
  const vacancy = estimatedRent * (config.vacancyRate / 100);
  
  const totalExpenses = monthlyMortgage + propertyTax + insurance + maintenance + 
                        propertyManagement + vacancy;
  
  // Calculate metrics
  const cashFlow = estimatedRent - totalExpenses;
  const rentRatio = (estimatedRent / price) * 100;
  const capRate = ((estimatedRent * 12 - (propertyTax * 12 + insurance * 12 + maintenance * 12)) / price) * 100;
  const roi = ((cashFlow * 12) / downPayment) * 100;
  
  // Calculate score (0-100)
  let score = 0;
  if (cashFlow > 0) score += 30;
  if (rentRatio >= config.minRentRatio) score += 25;
  if (capRate > 8) score += 20;
  if (roi > 10) score += 25;
  
  // Determine if it's a good deal
  const isGoodDeal = cashFlow >= config.minCashFlow && 
                     rentRatio >= config.minRentRatio &&
                     score >= 70;
  
  return {
    ...property,
    estimatedRent,
    monthlyMortgage: Math.round(monthlyMortgage),
    propertyTax: Math.round(propertyTax),
    insurance,
    maintenance: Math.round(maintenance),
    propertyManagement: Math.round(propertyManagement),
    vacancy: Math.round(vacancy),
    totalExpenses: Math.round(totalExpenses),
    cashFlow: Math.round(cashFlow),
    rentRatio: parseFloat(rentRatio.toFixed(2)),
    capRate: parseFloat(capRate.toFixed(2)),
    roi: parseFloat(roi.toFixed(2)),
    score: Math.round(score),
    isGoodDeal
  };
}

// Send email alert for good deals
async function sendPropertyAlert(property) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.ALERT_EMAIL || process.env.EMAIL_USER,
    subject: `🏠 Investment Opportunity: ${property.address} - Score ${property.score}/100`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New Investment Opportunity Found!</h2>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${property.address}</h3>
          <p style="color: #6b7280;">${property.city}, ${property.state} ${property.zipCode}</p>
        </div>
        
        <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
          <h4 style="margin: 0 0 10px 0; color: #059669;">Investment Score: ${property.score}/100</h4>
          <p style="margin: 0; font-size: 14px; color: #047857;">This property meets your investment criteria!</p>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background: #f9fafb;">
            <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>Price</strong></td>
            <td style="padding: 12px; border: 1px solid #e5e7eb;">$${property.price.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>Estimated Rent</strong></td>
            <td style="padding: 12px; border: 1px solid #e5e7eb; color: #10b981;">$${property.estimatedRent.toLocaleString()}/mo</td>
          </tr>
          <tr style="background: #f9fafb;">
            <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>Monthly Cash Flow</strong></td>
            <td style="padding: 12px; border: 1px solid #e5e7eb; color: ${property.cashFlow > 0 ? '#10b981' : '#ef4444'};">
              $${property.cashFlow.toLocaleString()}/mo
            </td>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>Cap Rate</strong></td>
            <td style="padding: 12px; border: 1px solid #e5e7eb;">${property.capRate}%</td>
          </tr>
          <tr style="background: #f9fafb;">
            <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>Rent Ratio</strong></td>
            <td style="padding: 12px; border: 1px solid #e5e7eb;">${property.rentRatio}%</td>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>ROI</strong></td>
            <td style="padding: 12px; border: 1px solid #e5e7eb;">${property.roi}%</td>
          </tr>
        </table>
        
        <div style="background: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="margin: 0 0 10px 0;">Property Details</h4>
          <p style="margin: 5px 0;"><strong>Beds:</strong> ${property.bedrooms} | <strong>Baths:</strong> ${property.bathrooms}</p>
          <p style="margin: 5px 0;"><strong>Square Feet:</strong> ${property.squareFeet?.toLocaleString() || 'N/A'}</p>
        </div>
        
        <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="margin: 0 0 10px 0;">Monthly Expenses Breakdown</h4>
          <p style="margin: 5px 0;">Mortgage: $${property.monthlyMortgage.toLocaleString()}</p>
          <p style="margin: 5px 0;">Property Tax: $${property.propertyTax.toLocaleString()}</p>
          <p style="margin: 5px 0;">Insurance: $${property.insurance.toLocaleString()}</p>
          <p style="margin: 5px 0;">Maintenance: $${property.maintenance.toLocaleString()}</p>
          <p style="margin: 5px 0;">Property Management: $${property.propertyManagement.toLocaleString()}</p>
          <p style="margin: 5px 0;">Vacancy Reserve: $${property.vacancy.toLocaleString()}</p>
          <p style="margin: 10px 0 0 0; padding-top: 10px; border-top: 2px solid #e5e7eb;">
            <strong>Total Expenses: $${property.totalExpenses.toLocaleString()}/mo</strong>
          </p>
        </div>
        
        <p style="color: #6b7280; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          This is an automated alert from your Property Investment Analyzer.
        </p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Alert sent for property: ${property.address}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return false;
  }
}

// API Endpoints

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Property Analyzer API is running' });
});

// Scan properties endpoint
app.post('/api/scan-properties', async (req, res) => {
  try {
    const { config } = req.body;
    console.log('🔍 Starting property scan...');
    
    let allProperties = [];
    let goodDeals = [];
    let alertsSent = 0;

    // Scan each city
    for (const city of config.targetCities) {
      try {
        console.log(`Scanning ${city}...`);
        
        // Search for properties in the city using RentCast API
        const response = await axios.get(`${RENTCAST_BASE_URL}/properties`, {
          params: {
            city: city.split(',')[0].trim(),
            state: city.split(',')[1]?.trim() || '',
            limit: 50,
            maxPrice: config.maxPrice,
            status: 'For Sale'
          },
          headers: {
            'X-Api-Key': RENTCAST_API_KEY
          }
        });

        const properties = response.data || [];
        console.log(`Found ${properties.length} properties in ${city}`);

        // Get rent estimates for each property
        for (const property of properties) {
          try {
            // Get rent estimate
            const rentResponse = await axios.get(`${RENTCAST_BASE_URL}/avm/rent/value`, {
              params: {
                address: property.formattedAddress || property.address,
                propertyType: property.propertyType || 'Single Family'
              },
              headers: {
                'X-Api-Key': RENTCAST_API_KEY
              }
            });

            const rentEstimate = rentResponse.data?.rent || 0;
            
            // Analyze the property
            const analyzedProperty = analyzeProperty({
              ...property,
              rentEstimate,
              address: property.formattedAddress || property.address || 'Address Unknown',
              city: property.city || city.split(',')[0].trim(),
              state: property.state || city.split(',')[1]?.trim() || '',
              zipCode: property.zipCode || '',
              price: property.price || 0,
              bedrooms: property.bedrooms || 0,
              bathrooms: property.bathrooms || 0,
              squareFeet: property.squareFootage || null
            }, config);

            allProperties.push(analyzedProperty);

            // Send alert if it's a good deal
            if (analyzedProperty.isGoodDeal) {
              goodDeals.push(analyzedProperty);
              const sent = await sendPropertyAlert(analyzedProperty);
              if (sent) alertsSent++;
            }

            // Rate limiting - wait between API calls
            await new Promise(resolve => setTimeout(resolve, 250));

          } catch (error) {
            console.error(`Error analyzing property: ${error.message}`);
          }
        }

      } catch (error) {
        console.error(`Error scanning ${city}:`, error.message);
      }
    }

    // Sort by score
    allProperties.sort((a, b) => b.score - a.score);

    console.log(`✅ Scan complete: ${allProperties.length} properties, ${goodDeals.length} good deals, ${alertsSent} alerts sent`);

    res.json({
      properties: allProperties.slice(0, 20), // Return top 20
      stats: {
        total: allProperties.length,
        goodDeals: goodDeals.length,
        alertsSent
      }
    });

  } catch (error) {
    console.error('❌ Error in scan-properties:', error);
    res.status(500).json({ 
      error: 'Failed to scan properties', 
      message: error.message 
    });
  }
});

// Test email endpoint
app.post('/api/test-email', async (req, res) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ALERT_EMAIL || process.env.EMAIL_USER,
      subject: '🏠 Property Analyzer - Test Email',
      html: `
        <h2>Test Email</h2>
        <p>Your Property Investment Analyzer email system is working correctly!</p>
        <p>Time: ${new Date().toLocaleString()}</p>
      `
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: 'Test email sent successfully' });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send test email',
      message: error.message 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║   🏠 Property Analyzer API Server         ║
║   Running on: http://localhost:${PORT}       ║
║   Status: ✅ Ready                         ║
╚════════════════════════════════════════════╝
  `);
});