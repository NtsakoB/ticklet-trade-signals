#!/usr/bin/env python3
"""
Test Supabase Connection
Tests the Supabase client connection and basic functionality
"""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_supabase_connection():
    """Test Supabase client connection"""
    try:
        from supabase import create_client
        
        # Get environment variables
        url = os.getenv("TICKLET_SUPABASE_URL")
        key = os.getenv("TICKLET_SUPABASE_ANON_KEY")
        
        if not url or not key:
            print("❌ Missing Supabase environment variables")
            print(f"TICKLET_SUPABASE_URL: {'✓' if url else '✗'}")
            print(f"TICKLET_SUPABASE_ANON_KEY: {'✓' if key else '✗'}")
            return False
        
        # Create client
        client = create_client(url, key)
        print("✅ Supabase client created successfully")
        
        # Test basic query
        result = client.table("chat_logs").select("*").limit(1).execute()
        print(f"✅ Supabase connected successfully: {len(result.data) if result.data else 0} records found")
        
        return True
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("Try: pip install supabase==2.3.3")
        return False
    except Exception as e:
        print(f"❌ Connection error: {e}")
        return False

def test_alternative_import():
    """Test alternative import method"""
    try:
        from supabase.client import create_client
        print("✅ Alternative import works: from supabase.client import create_client")
        return True
    except ImportError as e:
        print(f"❌ Alternative import failed: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Testing Supabase Connection...")
    print("-" * 50)
    
    # Test main import
    success = test_supabase_connection()
    
    if not success:
        print("\n🔄 Trying alternative import...")
        test_alternative_import()
    
    print("-" * 50)
    print("✅ Test completed" if success else "❌ Test failed")