#!/usr/bin/env python3
"""
Test existing session token and course generation fix
"""

import requests
import json
import time

API_URL = "https://e2ec0b73-865a-443e-8d58-cb14dd92f904.preview.emergentagent.com"
EXISTING_SESSION = "test_session_1773191283959"

def test_existing_session():
    """Test with existing session token"""
    print("🔍 Testing existing session token...")
    
    try:
        response = requests.get(
            f"{API_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {EXISTING_SESSION}"},
            timeout=10
        )
        
        if response.status_code == 200:
            user_data = response.json()
            print(f"✅ Existing session works! User: {user_data.get('name')}")
            return True, user_data
        else:
            print(f"❌ Existing session invalid: {response.status_code}")
            return False, None
    except Exception as e:
        print(f"❌ Error testing session: {e}")
        return False, None

def test_course_generation_fix():
    """Test the fixed course generation endpoint"""
    print("\n🔍 Testing FIXED course generation with retry logic...")
    
    course_data = {
        "prompt": "Advanced JavaScript Concepts",
        "difficulty": "intermediate",
        "num_lessons": 4
    }
    
    try:
        print("🔄 Generating course (testing retry logic fix)...")
        start_time = time.time()
        
        response = requests.post(
            f"{API_URL}/api/courses/generate",
            headers={
                "Authorization": f"Bearer {EXISTING_SESSION}",
                "Content-Type": "application/json"
            },
            json=course_data,
            timeout=120  # 2 minutes for AI generation
        )
        
        end_time = time.time()
        duration = end_time - start_time
        
        if response.status_code == 200:
            course = response.json()
            print(f"✅ Course generation WORKS! Generated in {duration:.1f}s")
            print(f"   Title: {course.get('title')}")
            print(f"   Lessons: {len(course.get('lessons', []))}")
            print(f"   Course ID: {course.get('course_id')}")
            return True, course
        else:
            print(f"❌ Course generation failed: {response.status_code}")
            print(f"   Response: {response.text[:200]}")
            return False, None
            
    except Exception as e:
        print(f"❌ Course generation error: {e}")
        return False, None

def test_existing_course():
    """Test getting existing 'Basic Python Loops' course"""
    print("\n🔍 Testing access to existing courses...")
    
    try:
        response = requests.get(
            f"{API_URL}/api/courses",
            headers={"Authorization": f"Bearer {EXISTING_SESSION}"},
            timeout=10
        )
        
        if response.status_code == 200:
            courses = response.json()
            print(f"✅ Found {len(courses)} existing courses")
            
            for course in courses:
                print(f"   - {course.get('title')} ({course.get('difficulty')})")
                if 'Basic Python Loops' in course.get('title', ''):
                    print(f"     Found mentioned 'Basic Python Loops' course!")
            
            return True, courses
        else:
            print(f"❌ Failed to get courses: {response.status_code}")
            return False, None
    except Exception as e:
        print(f"❌ Error getting courses: {e}")
        return False, None

def main():
    print("🚀 Testing AI Course Builder - Second Iteration (Fixed)")
    print("=" * 60)
    
    # Test existing session
    session_valid, user_data = test_existing_session()
    if not session_valid:
        print("❌ Cannot test with invalid session")
        return 1
    
    # Test existing courses
    test_existing_course()
    
    # Test fixed course generation
    generation_works, course = test_course_generation_fix()
    
    print("\n" + "=" * 60)
    print("📊 QUICK TEST SUMMARY:")
    print(f"   Session Valid: {'✅' if session_valid else '❌'}")
    print(f"   Course Generation: {'✅' if generation_works else '❌'}")
    
    if generation_works:
        print("🎉 AI course generation FIX appears to be working!")
    else:
        print("⚠️ AI course generation still has issues")
    
    return 0 if generation_works else 1

if __name__ == "__main__":
    import sys
    sys.exit(main())